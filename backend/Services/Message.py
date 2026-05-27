from models import Message
from db import session

def save_message(chat_id: int, role: str, content: str):
    db = session()  # <-- fresh session, owned by this thread
    try:
        if not chat_id or not role or not content:
            print("Warning: Attempted to save message with missing data")
            return None

        msg = Message(
            chat_id=chat_id,
            role=role,
            content=content.strip(),
        )

        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    except Exception as e:
        db.rollback()
        print(f"Error in save_message: {str(e)}")
        raise Exception(f"Failed to save message to database: {str(e)}")
    
    finally:
        db.close()  # <-- always close the session you opened