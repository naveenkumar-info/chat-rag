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
from Services.Chroma_service import ChromaService
from langsmith import traceable
import os
from langsmith.run_trees import RunTree

# pyrefly: ignore [missing-import]
from groq import Groq

# os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_PROJECT"] = "new-rag-as"

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

chroma = ChromaService()

async def process_chat_stream(chat_id, question, db: Session, clerk_id: dict):
    try:

        rt = RunTree(name="process_chat_stream", run_type="chain",inputs={"chat_id":chat_id,"question":question,"clerk_id":clerk_id} )

        print("save msg for user", flush=True)
        
        # 2. Get history immediately
        history = get_chat_history(db, chat_id)

        print("get chat his", flush=True)
        print("just before stream gen", flush=True)

        async def stream_generator():

            child = rt.create_child(
                name="generate_response",
                run_type="llm",
                inputs={
                    "question":question,
                    "history":history
                }
            )

            print("inside stream gen - starting!", flush=True)
            full_answer = ""
            
            try:
                # The error is happening somewhere inside this loop
                async for token in get_answer_stream(question, history, db, chat_id):
                    print(f"token: {token}", flush=True)
                    full_answer += token
                    yield token
                
                if full_answer:
                    
                    save_message(db, chat_id, clerk_id['role'], question)
                    save_message(db, chat_id, "assistant", full_answer)

                    child.end(
                        outputs={
                            "response":full_answer
                        }
                    )
                    child.post()

                    print("Assistant message saved successfully.", flush=True)
                    
            except Exception as stream_err:
                # Catch the error where it actually happens!
                child.end(error=str(stream_err))
                child.post()
                print(f"Error DURING streaming: {str(stream_err)}", flush=True)
                yield f"An error occurred while generating the response."

            finally:
                rt.end(
                    outputs={
                        "response":full_answer
                    }
                )
                rt.post()
                
        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Initial setup error: {str(e)}", flush=True)
        return {"error": str(e)}

def delete_chat(chat_id, db: Session,clerk_id:str):
    try:
        # 1. Fetch the chat record from the database
        chat_to_delete = db.query(Chat).filter(Chat.id == chat_id).first()

        if not chat_to_delete:
            print(f"Delete attempt failed: Chat with ID {chat_id} not found")
            return {"error": "Chat not found"}
        
        if chat_to_delete.clerk_id != clerk_id:
            print(f"Delete attempt failed: User {clerk_id} does not own chat {chat_id}")
            return {"error": "Access denied to delete this chat"}

        # 2. Delete all messages associated with this chat
        # Bulk delete is more efficient than individual deletions
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
        # Provide a descriptive error for the API layer
        raise Exception(f"Failed to delete chat and messages: {str(e)}")

@traceable(name="get_standalone_question",run_type="chain")
async def get_standalone_question(query: str, history_context: dict):
    print("in get standalone question", flush=True)
    
    standalone_question_prompt = f"""
        Based on the conversation history provided, rephrase the latest user query into a standalone question.
        The standalone question should capture the user's intent and context so that it can be answered correctly without the history.
        If the user's query is already standalone, return it as is.

        ##RULES
        - Dont return anything other than the actual answer be formal dont write anything like according to the question.
        - Dont write "The rephrased standalone question is" or "The latest user query is already a standalone question" or anything like this as a prefix of the actual output.

        ##conversation history:
        {history_context}

        ##Latest User Query:
        {query}

        
    """
    print("standalone prompt created", flush=True)

    

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content":standalone_question_prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
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
@traceable(name="get_answer_stream", run_type="chain")
async def get_answer_stream(query: str, history: list, db: Session, chat_id: int):
    try:
        print("get ans stream")

        # 1. SMART HISTORY LOGIC (Summarization)
        if len(history) > 6:
            old_stuff = history[:-3]
            recent_stuff = history[-3:]
            summary = await summarize_history(old_stuff)
            formatted_recent = format_history(recent_stuff)
            history_context = f"Summary of previous conversation: {summary}\n\nRecent messages:\n{formatted_recent}"
        else:
            history_context = format_history(history)

        print("format his")

        print("original query : ", query)
        standalone_question = await get_standalone_question(query, history_context)
        print("standalone question: ", standalone_question)

        # 2. DATABASE SEARCH (RAG)
        query_embedd = await get_embedding(standalone_question)
        print("embedded")

        loop = asyncio.get_running_loop()
        results = await loop.run_in_executor(None, lambda: chroma.search(query_embed=query_embedd, top_k=3))
        print("file resultsssssss", results)

        # Extract metadata separately and clean the text
        file_contexts = []
        for r in results:
            raw_text = r.get("text", "")
            metadata = r.get("metadata", {})
            section = metadata.get("section", "")

            if section and raw_text.startswith(f"Section {section}"):
                clean_text = raw_text[len(f"Section {section}"):].strip()
            else:
                clean_text = raw_text.strip()

            file_contexts.append(clean_text)

        file_context = "".join(file_contexts)
        print("file contextttt", file_context)

        # 3. BUILD MESSAGES FOR GROQ CHAT COMPLETION
        system_prompt = """### ROLE
You are a High-Precision Information Extraction Assistant. Your goal is to answer questions using ONLY the provided document context.

### RULES
1. NO OUTSIDE KNOWLEDGE: If the answer is not in the context, you must fail gracefully.
2. NO META-TALK: Do not say "Based on the documents" or "According to the context." or "Based on the provided context".
3. NO PREAMBLES: Do not say "Here is the answer" or "I am happy to help."
4. NO REPETITION: If the conversation history already contains the answer, summarize or clarify rather than repeating.
5. Do not include any prefix before your actual answer — write the direct answer only.

### EXAMPLES
User Question: "What is the company's refund policy?"
Context: "Refunds are processed within 5-7 business days."
Assistant: Refunds are processed within 5-7 business days.

User Question: "Who is the CEO?"
Context: "No relevant documents found."
Assistant: I am sorry, but the provided context does not contain information to answer this question.

### CHAIN OF VERIFICATION
1. Read the <context> and <history>.
2. Identify the specific facts from the context that relate to the <query>.
3. Based ONLY on those facts, provide the FINAL ANSWER directly.
4. If no facts are found, state that the information is missing."""

        user_message = f"""### CONTEXT FROM FILES
<context>
{file_context if file_context.strip() else "No relevant documents found."}
</context>

### CONVERSATION HISTORY
<history>
{history_context}
</history>

### USER'S QUESTION
<query>
{standalone_question}
</query>"""

        # 4. STREAM FROM GROQ
        full_answer = ""

        groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

        # Run the sync Groq streaming call in a thread executor to avoid blocking the event loop
        def run_groq_stream():
            return groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                stream=True,
                temperature=0.1,  # Low temperature for strictness/precision
                max_tokens=1024,
                stop=["###", "USER:", "Assistant:"],
            )

        stream = await loop.run_in_executor(None, run_groq_stream)

        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            full_answer += token
            if token:
                yield token

            # Check if stream is finished
            if chunk.choices[0].finish_reason is not None:
                # Store the interaction after full answer is streamed
                db.add(Interaction(
                    chat_id=chat_id,
                    question=standalone_question,
                    context=file_context,
                    answer=full_answer
                ))
                db.commit()
                break

    except Exception as e:
        print(f"Error in get answer stream: {str(e)}")
        yield f"[Streaming Error in get answer stream: {str(e)}]"