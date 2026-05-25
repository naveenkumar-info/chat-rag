from models import Message
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
            content=content.strip(),
            
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

