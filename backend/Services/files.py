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
def upload_file(db: Session, file: UploadFile):
    try:
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
        db.commit()
        db.refresh(new_file)

        # 5. RAG Pipeline: Parse, Embed, and Store in ChromaDB
        try:
            # Parse the file content from the URL
            parsed_data = parse_file(file_url, resource)
            
            # Generate vector embeddings
            embeddings = embed_chunks(parsed_data)
            
            # Store in ChromaDB using the Postgres file ID as a reference
            if embeddings:
                chroma.store(embeddings, new_file.id)
            else:
                print(f"Warning: No embeddings generated for file_id {new_file.id}")

        except Exception as pipeline_error:
            print(f"Error in RAG pipeline processing: {str(pipeline_error)}")
            # We don't necessarily want to crash the whole upload if just the vector storage fails,
            # but you can choose to re-raise here if RAG is mandatory.

        return new_file

    except Exception as e:
        # Rollback the DB session if an error occurred during the Postgres transaction
        db.rollback()
        print(f"Error in upload_file: {str(e)}")
        raise Exception(f"File upload and processing failed: {str(e)}")

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
def format_history(history: list):
    try:
        if not isinstance(history, list):
            raise ValueError("History must be a list")

        history_text = ""
        for msg in history:
            try:
                # Safely extract role and content
                role = msg.get("role", "unknown")
                content = msg.get("content", "")

                if not content:
                    continue

                if role == "user":
                    history_text += f"User: {content}\n"
                else:
                    history_text += f"Assistant: {content}\n"
            
            except Exception as inner_e:
                print(f"Error processing message in history: {str(inner_e)}")
                continue
                
        return history_text

    except Exception as e:
        print(f"Error in format_history: {str(e)}")
        return ""

def get_answer(query: str, history: list):
    try:
        # 1. Prepare conversation history and query embedding
        history_text = format_history(history)
        query_embedd = get_embedding(query)
        
        # 2. Search ChromaDB with safety check
        results = []
        try:
            results = chroma.search(query_embed=query_embedd, top_k=5)
        except Exception as search_e:
            print(f"ChromaDB search failed: {str(search_e)}")
        
        # 3. Build context string
        if results:
            context = "\n\n".join([r.get("text", "") for r in results if r.get("text")])
        else:
            context = "No additional file context found."

        # 4. Unified Prompt Construction
        prompt = f"""
        You are a knowledgeable AI assistant.

        Use the provided Context and the Conversation History to answer the User's question.
        If the User's question uses pronouns like "it", "that", or "they", look at the Conversation History to understand what they are referring to.

        CONTEXT FROM FILES:
        {context}

        CONVERSATION HISTORY:
        {history_text}

        USER'S NEW QUESTION:
        {query}

        ANSWER:
        """

        # 5. Request to Local LLM (Ollama)
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_ctx": 4096
                    }
                },
                timeout=60 # Added timeout for long LLM generations
            )
            response.raise_for_status()
            
            # Extract only the response text from Ollama's JSON
            llm_data = response.json()
            answer_text = llm_data.get("response", "No response generated by the model.")

        except Exception as llm_e:
            print(f"LLM generation failed: {str(llm_e)}")
            answer_text = "I'm sorry, I encountered an error while generating an answer."

        return {
            "answer": answer_text,
            "sources": results
        }

    except Exception as e:
        print(f"Error in get_answer: {str(e)}")
        return {
            "answer": "An internal error occurred while processing your request.",
            "sources": []
        }
