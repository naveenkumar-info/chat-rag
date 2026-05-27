from models import Message
from sqlalchemy.orm import Session
import httpx
from langsmith import traceable
# pyrefly: ignore [missing-import]
from groq import Groq 
import os

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)


#formatting the history
@traceable(name="format_history",run_type="tool")
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

@traceable(name="summarize_history",run_type="chain")
async def summarize_history(old_messages: list):
    if not old_messages:
        return ""
    
    # Format the old stuff for the summarizer
    text_to_summarize = "\n".join([
        f"{'User' if getattr(m, 'role', 'user') == 'user' else 'Assistant'}: {getattr(m, 'content', '')}"
        for m in old_messages
    ])

    summary_prompt = f"Summarize the following chat history in 3-4 concise sentences, focusing on the key topics discussed:\n\n{text_to_summarize}"

    # async with httpx.AsyncClient(timeout=None) as client:
    #     response = await client.post(
    #         "http://localhost:11434/api/generate",
    #         json={
    #             "model": "llama3.2",
    #             "prompt": summary_prompt,
    #             "stream": False # We want the whole summary at once
    #         }
    #     )
    #     result = response.json()

    #Using GROq

    summary_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content":summary_prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
        )



    return summary_completion.choices[0].message.content
    

@traceable(name="get_chat_history",run_type="tool")
def get_chat_history(db: Session, chat_id: int):
    try:
        # 1. Query the database for messages belonging to the chat_id
        messages = db.query(Message).filter(
            Message.chat_id == chat_id
        ).order_by(Message.created_at).all()

        # 2. Return an empty list if no messages are found
        if not messages:
            return []

        # 3. Format the result for the LLM or UI
        return [
            {
                "role": m.role,
                "content": m.content
            } for m in messages
        ]

    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")
        return []
