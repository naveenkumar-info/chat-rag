from models import files
from sqlalchemy.orm import Session
from config.cloudinary import cloudinary
from fastapi import UploadFile
from cloudinary import uploader
from Services.Chat import get_embedding,embed_chunks,group_html_sections,group_by_section,chunk_files,chunk_excel_rows,parse_docx,parse_html,parse_image,parse_pdf,parse_excel
from Services.chroma_service import ChromaService
import requests

#instance of chroma
chroma = ChromaService()

# File parsing - parse + group + chunking
def parse_file(file_path, file_type):
    try:
        # Normalize the file_type string for easier comparison
        file_type = file_type.lower()
        chunks = []

        if "pdf" in file_type:
            parse = parse_pdf(file_path)
            groups = group_by_section(parse)
            chunks = chunk_files(groups)
        
        elif "image" in file_type:
            parse = parse_image(file_path)
            groups = group_by_section(parse)
            chunks = chunk_files(groups)

        elif "html" in file_type:
            parse = parse_html(file_path)
            groups = group_html_sections(parse)
            chunks = chunk_files(groups)

        elif "spreadsheet" in file_type:
            parse = parse_excel(file_path)
            chunks = chunk_excel_rows(parse)

        elif "document" in file_type:
            parse = parse_docx(file_path)
            groups = group_by_section(parse)
            chunks = chunk_files(groups)
            
        else:
            print(f"Unsupported file type encountered: {file_type}")
            raise ValueError(f"Unsupported file type: {file_type}")

        # Return the processed chunks if successfully generated
        return chunks

    except Exception as e:
        # Standardized error logging for any failure in the parsing pipeline
        print(f"Error in parse_file pipeline: {str(e)}")
        # Re-raising for the service layer to handle the specific failure
        raise Exception(f"File parsing failed: {str(e)}")

# uploading the file - PG + CHROMA + Cloudinary
async def upload_file(db: Session, file: UploadFile):
    try:
        print("hi")
        file.file.seek(0)
        # 1. Store file in Cloudinary
        # Using a timeout or specific error handling for network calls
        result = cloudinary.uploader.upload(
            file.file, 
            access_mode="public", 
            folder="rag", 
            resource_type="auto"
        )

        # 2. Retrieve URL, format, and ID
        file_url = result.get("secure_url")
        file_format = (result.get("format") or file.filename.split(".")[-1]).lower()
        public_id = result.get("public_id")

        if not file_url or not public_id:
            raise ValueError("Cloudinary upload failed to return necessary file data")

        # 3. Identify the resource category for the parser
        if file_format in ["pdf"]:
            resource = "pdf"
        elif file_format in ["jpg", "jpeg", "png"]:
            resource = "image"
        elif file_format in ["docx"]:
            resource = "document"
        elif file_format in ["xlsx"]:
            resource = "spreadsheet"
        else:
            resource = "html"

        # 4. Save file metadata to Postgres
        new_file = files(
            filename=file.filename,
            file_url=file_url,
            file_type=file_format,
            public_id=public_id  
        )

        db.add(new_file)
        db.flush()  # <--- Get the ID without fully committing yet
        db.commit() 
        db.refresh(new_file)

        # 5. RAG Pipeline: Parse, Embed, and Store in ChromaDB
        try:
            # parse_file is SYNC, so we run it in a thread to prevent blocking the server
            loop = asyncio.get_running_loop()
            parsed_data = await loop.run_in_executor(None, lambda: parse_file(file_url, resource))
            
            embeddings = await embed_chunks(parsed_data)
            
            if embeddings:
                # YOU ALREADY MADE THIS ASYNC, GOOD!
                await chroma.store(embeddings, new_file.id)
        except Exception as pipeline_error:
            print(f"RAG Error: {pipeline_error}")
        return new_file

    except Exception as e:
        db.rollback()
        raise e

# Used during testing to know chroma upload / delete are working
def check_chroma_size():
    size = chroma.collection.count()

    return size


# Delete files from PG + CHROMA using file_id created in the PG and stored in the chroma metadata
def delete_file(db: Session, file_id: int):
    try:
        # 1. Fetch the file record from Postgres
        file = db.query(files).filter(files.id == file_id).first()

        if not file:
            raise ValueError(f"File with id {file_id} not found")

        # 2. Determine Cloudinary resource type
        # Cloudinary uses 'raw' for PDF, DOCX, and XLSX, and 'image' for photos
        file_type = file.file_type.lower() if file.file_type else ""
        
        if file_type in ["jpg", "jpeg", "png"]:
            resource = "image"
        else:
            resource = "raw"

        # 3. Delete from Cloudinary
        try:
            cloudinary.uploader.destroy(file.public_id, resource_type=resource)
        except Exception as cloud_e:
            print(f"Warning: Cloudinary deletion failed: {str(cloud_e)}")

        # 4. Delete from ChromaDB (Vector Store)
        try:
            chroma.delete(file_id)
        except Exception as chroma_e:
            print(f"Warning: ChromaDB deletion failed: {str(chroma_e)}")

        # 5. Delete from Postgres
        db.delete(file)
        db.commit()
        
        return {"message": "File and associated data deleted successfully"}

    except Exception as e:
        # Rollback Postgres transaction if the database delete fails
        db.rollback()
        print(f"Error in delete_file: {str(e)}")
        raise Exception(f"Failed to delete file: {str(e)}")

# used during testing - delete all chroma files at once
def del_all_chroma():
    ChromaService.delete_all(chroma)


#formatting the history
def format_history(history: list, max_chars: int = 6000):
    if not history:
        return ""
    
    formatted_parts = []
    current_chars = 0
    
    # Iterate backwards to keep the MOST RECENT messages
    for msg in reversed(history):
        role = getattr(msg, 'role', None) or msg.get('role', 'unknown')
        content = getattr(msg, 'content', None) or msg.get('content', '')
        
        if not content: continue
        
        entry = f"{'User' if role == 'user' else 'Assistant'}: {content}"
        
        # Check if adding this message exceeds our safety cap
        if current_chars + len(entry) > max_chars:
            break
            
        formatted_parts.append(entry)
        current_chars += len(entry)
    
    # Flip back to correct chronological order
    return "\n".join(reversed(formatted_parts))


async def summarize_history(old_messages: list):
    if not old_messages:
        return ""
    
    # Format the old stuff for the summarizer
    text_to_summarize = "\n".join([
        f"{'User' if getattr(m, 'role', 'user') == 'user' else 'Assistant'}: {getattr(m, 'content', '')}"
        for m in old_messages
    ])

    summary_prompt = f"Summarize the following chat history in 3-4 concise sentences, focusing on the key topics discussed:\n\n{text_to_summarize}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2",
                "prompt": summary_prompt,
                "stream": False # We want the whole summary at once
            }
        )
        result = response.json()
        return result.get("response", "Conversation about various topics.")
    


import httpx
import json
import asyncio
async def get_answer_stream(query: str, history: list):
    try:
        # 1. SMART HISTORY LOGIC (Summarization)
        if len(history) > 6:
            old_stuff = history[:-3]
            recent_stuff = history[-3:]
            summary = await summarize_history(old_stuff)
            formatted_recent = format_history(recent_stuff)
            history_context = f"Summary of previous conversation: {summary}\n\nRecent messages:\n{formatted_recent}"
        else:
            history_context = format_history(history)

        # 2. DATABASE SEARCH (RAG)
        query_embedd = await get_embedding(query)
        # print("query",query_embedd)
        loop = asyncio.get_running_loop()
        # Chroma search
        results = await loop.run_in_executor(None, lambda: chroma.search(query_embed=query_embedd, top_k=3))
        print("filee resultsssssss",results)
        # Check if we actually found any relevant text in the files
        file_context = "\n\n".join([r.get("text", "") for r in results if r.get("text")])
        print("filee contextttt",file_context)
        

        # 3. STRICT SYSTEM PROMPT
        # We use a clear delimiter and explicit "None" handling
        # --- BALANCED CONTEXTUAL PROMPT ---
        # --- BALANCED CONTEXTUAL PROMPT ---
        prompt = f"""
        ### ROLE ###
        You are a helpful assistant that answers questions STRICTLY based on the provided documents.

        ### INSTRUCTIONS ###
        1. Answer the USER'S QUESTION using ONLY the information found in the "CONTEXT FROM FILES" provided below.
        2. You are allowed to understand synonyms and related concepts, but the core information MUST originate from the context.
        3. If the answer to the user's question is not explicitly present in the provided context, or if the context says "No relevant documents found," you must say: "I am sorry, but the provided context does not contain information to answer this question."
        4. Do NOT use any outside knowledge or provide information that is not supported by the context.
        5. Do not mention that you are using provided documents or refer to the context; just answer naturally.
        6. If the answer is in the context, provide a detailed response based on that information.

        ### CONTEXT FROM FILES ###
        {file_context if file_context.strip() else "No relevant documents found."}

        ### CONVERSATION HISTORY ###
        {history_context}

        ### USER'S QUESTION ###
        {query}

        ### FINAL ANSWER ###
        """
        print(prompt)

        # 4. STREAM FROM OLLAMA (Lower Temperature for Strictness)
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST", 
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "num_ctx": 4096, 
                        "stop": ["###", "USER:", "Assistant:"] # Prevents the AI from hallucinating extra dialogue
                    }
                }
            ) as response:
                async for line in response.aiter_lines():
                    if not line: continue
                    chunk = json.loads(line)
                    token = chunk.get("response", "")
                    if token:
                        yield token
                    if chunk.get("done"): 
                        break

    except Exception as e:
        yield f"[Streaming Error: {str(e)}]"  


