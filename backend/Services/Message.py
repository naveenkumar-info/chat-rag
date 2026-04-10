from models import Chat,Message
from Services.files import get_answer_stream
from sqlalchemy.orm import Session

def save_message(db: Session, chat_id: int, role: str, content: str):
    try:
        # 1. Validate inputs to prevent database constraint errors
        if not chat_id or not role or not content:
            print("Warning: Attempted to save message with missing data")
            return None

        # 2. Create the new message instance
        msg = Message(
            chat_id=chat_id,
            role=role,
            content=content.strip()
        )

        # 3. Add to the database and commit the transaction
        db.add(msg)
        db.commit()
        db.refresh(msg)
        
        return msg

    except Exception as e:
        # 4. Rollback the session if the commit fails
        db.rollback()
        print(f"Error in save_message: {str(e)}")
        # Raise an exception so the API layer can return a 500 status if necessary
        raise Exception(f"Failed to save message to database: {str(e)}")

def get_chat_history(db: Session, chat_id: int):
    try:
        # 1. Query the database for messages belonging to the chat_id
        # Ordered by creation time to ensure the conversation flow is correct
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
        # 4. Standardized error logging for database connection or query issues
        print(f"Error in get_chat_history: {str(e)}")
        # Return an empty list to prevent the calling function from crashing
        return []

from fastapi.responses import StreamingResponse

async def process_chat_stream(chat_id, question, db: Session):
    try:
        # 1. Save user message immediately (while session is definitely open)
        save_message(db, chat_id, "user", question)

        print("save msg for user")
        
        # 2. Get history immediately
        history = get_chat_history(db, chat_id)

        print("get chat his")

        async def stream_generator():
            print("stream gen")
            full_answer = ""
            async for token in get_answer_stream(question, history):
                print("token : ",token)
                full_answer += token
                yield token
            
            if full_answer:
                # IMPORTANT: Re-verify session or use a local scoped session if this fails
                save_message(db, chat_id, "assistant", full_answer)

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Initial Error: {str(e)}")
        return {"error": str(e)}


def delete_chat(chat_id, db: Session):
    try:
        # 1. Fetch the chat record from the database
        chat_to_delete = db.query(Chat).filter(Chat.id == chat_id).first()

        if not chat_to_delete:
            print(f"Delete attempt failed: Chat with ID {chat_id} not found")
            return {"error": "Chat not found"}

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
