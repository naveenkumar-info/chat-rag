from typing import final
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from models import Chat,Message,Interaction
from Services.Message import save_message
from Services.history import format_history,summarize_history,get_chat_history
import httpx
import json
import asyncio
from Services.embedding import get_embedding
from Services.chroma_service import ChromaService
from langsmith import traceable
import os
from langsmith.run_trees import RunTree
from Services.prompts import system_prompt,stand_alone_question_prompt
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_classic.retrievers import EnsembleRetriever


# pyrefly: ignore [missing-import]
from groq import Groq,AsyncGroq
os.environ["LANGSMITH_PROJECT"] = "new-rag-as"

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)
async_client = AsyncGroq(
    api_key=os.environ.get("GROQ_API_KEY"),
)
chroma = ChromaService()

async def get_bm25_results(standalone_question: str):
    
    #1: GET ALL DOCS OF CHROMADB
    chroma_raw_data = chroma.get_all_collection()

    raw_texts = chroma_raw_data.get("documents", [])
    raw_metadatas = chroma_raw_data.get("metadatas", [])
    raw_ids = chroma_raw_data.get("ids", [])

    #print docs size to validate data is found
    print("\n", "IN BM25 GET ALL DOC : ",len(raw_texts))

    formatted_docs = []
    if raw_texts:
        for text, meta, doc_id in zip(raw_texts, raw_metadatas, raw_ids):
            # Merge the chunk id into the metadata dictionary so you track it
            meta_with_id = {**meta, "id": doc_id} if meta else {"id": doc_id}
            
            # Build the real Document object
            formatted_docs.append(Document(page_content=text, metadata=meta_with_id))
    
    #2: GIVE THE DOCS TO BM_25 RETRIEVER
    retriever = BM25Retriever.from_documents(formatted_docs)
    retriever.k = 5
    print("\n", "Retriever initiated")
    
    results = await retriever.ainvoke(standalone_question)
    print("\n", "IN BM25 GET ALL DOC : ",results)

    #3: Return the final results
    return results

async def reciprocal_rank_fusion(vector_results: list, bm25_results: list, k: int = 60):
    scores = {}
    doc_map = {}  

    def get_doc_id(doc):
        
        if isinstance(doc, dict):
            return doc.get("id") or doc.get("metadata", {}).get("id") or hash(doc.get("text", ""))
        elif hasattr(doc, "metadata"):
            return doc.metadata.get("id") or hash(doc.page_content)
        return hash(str(doc))

    # Score vector results (rank starts at 1)
    for rank, doc in enumerate(vector_results, start=1):
        
        doc_id = get_doc_id(doc)
        print("For doc ID : ",doc_id)
        print("Current Score :",scores.get(doc_id, 0))
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
        print("updated score :",scores.get(doc_id, 0))
        doc_map[doc_id] = doc  # Keep the doc object for later

    # Score BM25 results (rank starts at 1)
    for rank, doc in enumerate(bm25_results, start=1):
        
        doc_id = get_doc_id(doc)
        print("For doc ID : ",doc_id)
        print("Current Score :",scores.get(doc_id, 0))
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
        print("updated score :",scores.get(doc_id, 0))
        doc_map[doc_id] = doc

    # Sort by score descending, return top docs
    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)

    reranked_docs = [doc_map[doc_id] for doc_id in sorted_ids]

    print("\nRRF Reranked Results:")
    for i, doc_id in enumerate(sorted_ids):
        print(f"  Rank {i+1} | Score: {scores[doc_id]:.4f} | ID: {doc_id}")

    return reranked_docs






async def hybrid_search(query_embedd, standalone_question: str):
    loop = asyncio.get_running_loop()

    # STEP 1: Vector Search
    vector_results = await loop.run_in_executor(
        None, lambda: chroma.search(query_embed=query_embedd, top_k=5)  # bump to 5
    )
    #print("\n vector_results : ",vector_results)

    # STEP 2: BM25 Search
    bm25_results = await get_bm25_results(standalone_question)

    
    #print("\n BM25 RESULTS : ",bm25_results)

    # STEP 3: RRF Rerank
    final_results = await reciprocal_rank_fusion(vector_results, bm25_results)

    # STEP 4: Return top N for context
    return final_results[:5]
    

def store_interaction(db:Session,chat_id:int,standalone_question:str,file_context:str,full_answer:str):   
    db.add(Interaction(
        chat_id=chat_id,
        question=standalone_question,
        context=file_context,
        answer=full_answer
    ))
    db.commit()

async def summarize(history):
    if len(history) > 6:
        old_stuff = history[:-3] #left recent 3 msgs and get other left
        recent_stuff = history[-3:] #get the recent 3 msgs
        summary = await summarize_history(old_stuff)
        formatted_recent = format_history(recent_stuff)
        return f"Summary of previous conversation: {summary}\n\nRecent messages:\n{formatted_recent}"
    else:
        return format_history(history)

async def get_context(results):
    file_contexts = []
    for r in results:

        # Handle both Document objects and dicts
        if hasattr(r, "page_content"):  # LangChain Document
            raw_text = r.page_content
            section = r.metadata.get("section", "")
        else:                           # Chroma dict
            raw_text = r.get("text", "")
            section = r.get("metadata", {}).get("section", "")

        if section and raw_text.startswith(f"Section {section}"):
            clean_text = raw_text[len(f"Section {section}"):].strip()
        else:
            clean_text = raw_text.strip()

        file_contexts.append(clean_text)

    file_context = "\n\n".join(file_contexts)  # separator between chunks
    return file_context
    
async def run_groq_stream(system:str,user:str):
    #print("system PROMPT",system)
    #print("user PROMPT",user)
    return await async_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        stream=True,
        temperature=0.1, 
        stop=["###", "USER:", "Assistant:"],
    )

async def process_chat_stream(chat_id, question, db: Session, clerk_id: dict):
    try:

        #1: Created a tree for LANGSMITH
        rt = RunTree(name="process_chat_stream", run_type="chain",inputs={"chat_id":chat_id,"question":question,"clerk_id":clerk_id} )
        
        #2: Get history immediately
        history = get_chat_history(db, chat_id)       

        #3: Calling the async stream generator
        async def stream_generator():

            child = rt.create_child(
                name="generate_response",
                run_type="llm",
                inputs={
                    "question":question,
                    "history":history
                }
            )          
            
            full_answer = ""
            child_ended = False
            
            try:
                loop = asyncio.get_running_loop()
                async for token in get_answer_stream(question, history, db, chat_id):

                    full_answer += token
                    yield token
                
                if full_answer:
                    # await both saves so they complete before ending the child span
                    await loop.run_in_executor(None, save_message, chat_id, clerk_id['role'], question)
                    await loop.run_in_executor(None, save_message, chat_id, "assistant", full_answer)

                    child.end(outputs={"response": full_answer})
                    child.post()
                    child_ended = True
                    print("child posted SUCCESS")
                   

                    
            except Exception as stream_err:
                # Catch the error where it actually happens!
                child.end(error=str(stream_err))
                child.post()
                child_ended = True
                print(f"Error DURING streaming: {str(stream_err)}", flush=True)
                yield f"An error occurred while generating the response."

            finally:
                if not child_ended:
                    child.end(error="Unknown Error: Stream ended prematurely.")
                    child.post()
                rt.end(outputs={"response": full_answer})
                rt.post()
                
        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    except Exception as e:
        rt.end(error=str(e))
        rt.post()
        print(f"Initial setup error: {str(e)}", flush=True)
        return {"error": str(e)}



def delete_chat(chat_id, db: Session,clerk_id:str):
    try:

        #1: Fetch the chat record from the database
        chat_to_delete = db.query(Chat).filter(Chat.id == chat_id).first()

        if not chat_to_delete:
            print(f"Delete attempt failed: Chat with ID {chat_id} not found")
            return {"error": "Chat not found"}
        
        if chat_to_delete.clerk_id != clerk_id:
            print(f"Delete attempt failed: User {clerk_id} does not own chat {chat_id}")
            return {"error": "Access denied to delete this chat"}

        # 2. Delete all messages associated with this chat
        db.query(Message).filter(Message.chat_id == chat_id).delete()

        # 3. Delete the chat itself
        db.delete(chat_to_delete)

        # 4. Commit the transaction to apply changes
        db.commit()

        return {"message": "Chat and all associated messages have been deleted successfully"}

    except Exception as e:
        # 5. Rollback the database session if any part of the deletion fails
        db.rollback()
        print(f"Error in delete_chat: {str(e)}")
        raise Exception(f"Failed to delete chat and messages: {str(e)}")


@traceable(name="get_standalone_question",run_type="chain")
async def get_standalone_question(query: str, history_context: dict):
    
    standalone_question = stand_alone_question_prompt(history_context,query)
    #print("STAND ALONE PROMPT : ",standalone_question)

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content":standalone_question,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content

    

    #OLLAMA
    # try:
        # async with httpx.AsyncClient(timeout=None) as client:
        #     response = await client.post(
        #         "http://localhost:11434/api/generate",
        #         json={
        #             "model": "llama3.2",
        #             "prompt": standalone_question_prompt,
        #             "stream": False
        #         }
        #     )
            
        #     # 1. Check if Ollama returned an error (e.g., 404 Model not found)
        #     if response.status_code != 200:
        #         print(f"Ollama API Error {response.status_code}: {response.text}", flush=True)
        #         return query  # Fallback to the original query

        #     result = response.json()
        #     print("result received successfully", flush=True)
            
        #     # 2. Safely get the response, fallback to original query if missing
        #     return result.get("response", query)

    # Catch network failures (e.g., connection refused, timeout)
    # except httpx.RequestError as exc:
    #     print(f"Network error connecting to Ollama: {exc}", flush=True)
    #     return query 
        
    # Catch JSON parsing or other unexpected errors
    except Exception as exc:
        print(f"Unexpected error in get_standalone_question: {exc}", flush=True)
        return query


async def get_answer_stream(query: str, history: list, db: Session, chat_id: int):
    try:

        #1. Summarization
        history_context = await summarize(history)

        #2. Generate Standalone Question 
        standalone_question = await get_standalone_question(query, history_context)
        #print("standalone_question",standalone_question)
        
        #3: Get Query Embeddings 
        query_embedd = await get_embedding(standalone_question)


        #4: HYBRID SEARCH
        loop = asyncio.get_running_loop()
        results = await hybrid_search(query_embedd,standalone_question)

        #print("finals results are: ",results)

        #print("done till hybrid search")
        
        #5: Get Context
        file_context = await get_context(results)

        #print("done till get context")

        #6. BUILD MESSAGES FOR GROQ CHAT COMPLETION
        system,user = system_prompt(file_context,history_context,query,standalone_question)
        
        #7. STREAM FROM GROQ
        full_answer = ""
        stream = await run_groq_stream(system, user) 

        async for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            full_answer += token
            if token:
                yield token

        #8. Store each interactions for RAGAS testing   
        await loop.run_in_executor(None, store_interaction, db, chat_id, standalone_question, file_context, full_answer)

    except Exception as e:
        print(f"Error in get answer stream: {str(e)}")
        yield f"[Streaming Error in get answer stream: {str(e)}]"