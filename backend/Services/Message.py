from models import Chat,Message
from Services.files import get_answer

def save_message(db, chat_id, role, content):
    msg = Message(
        chat_id = chat_id,
        role = role,
        content = content,
    )
    db.add(msg)
    db.commit()

def get_chat_history(db,chat_id):
    messages = db.query(Message).filter(
        Message.chat_id == chat_id

    ).order_by(Message.created_at).all()

    return[
        {
            "role":m.role,"content":m.content
        } for m in messages
    ]

def process_chat(chat_id,question,db):

    save_message(db,chat_id,"user",question)

    print("msg saved user")

    history = get_chat_history(db,chat_id)

    print("history retrieved")

    raw_answer = get_answer(
        query=question,
        history=history
    )

    answer = raw_answer["answer"]["response"]

    save_message(db,chat_id,"assistant",answer)

    print("ans saved ai")

    return {"answer":answer}


