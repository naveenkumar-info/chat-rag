from fastapi import FastAPI, Form, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from Services.files import upload_file,delete_file,check_chroma_size,del_all_chroma
from models import files, Chat, Message
from db import get_db,Base,create_table
from Services.Message import process_chat,delete_chat


#instance of fastapi
app = FastAPI()

#CORS
origins = ["http://localhost:3000","http://192.168.0.239:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    return create_table()

# POST METHODS

#uploading the file PG + Chroma
@app.post("/uploadfile/")
async def upload_file_DB(
    db:Session = Depends(get_db),
    file:UploadFile = File(...),
    
    ):
    return upload_file(db,file)

@app.post("/get-answer")
async def ask_question(
    chat_id: int = Form(...),
    question: str = Form(...),  
    db:Session = Depends(get_db),
):
    return process_chat(chat_id,question,db)

@app.post("/chat/create_chat")
async def create_chat(name:str = Form(...),db:Session = Depends(get_db)):
    chat = Chat(
        name=name
    ) 
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return{"chat_id":chat.id}


# GET METHODS

#get all the files
@app.get("/files/")
async def get_files(db:Session = Depends(get_db)):
    return db.query(files).all()

#check chroma size - TESTING
@app.get("/check-size-chroma")
async def get_file_size(db:Session = Depends(get_db)):
    return check_chroma_size()

@app.get("/chats")
async def get_chats(db:Session = Depends(get_db)):
    chats = db.query(Chat).order_by(Chat.created_at.desc()).all()

    return [
        {
            "id":c.id,
            "name":c.name,
            "created_at":c.created_at
        }for c in chats
    ]

@app.get("/chat/{chat_id}")
def get_chat(chat_id:int,db:Session = Depends(get_db)):
    messages = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.created_at).all()

    return[
        {
            "role":m.role,
            "content":m.content
        }for m in messages
    ]

# DELETE METHODS

#delete all chroma storage - TESTING
@app.delete("/delete_all_chroma")
async def delete_all_chroma():
    return del_all_chroma()

#delete files from PG using file_id
@app.delete("/deletefiles/{file_id}")
async def delete_file_DB(
    file_id:int,
    db:Session = Depends(get_db)
):
    return delete_file(db,file_id)

@app.delete("/delete/{chat_id}")
async def delete_chat_byID(
    chat_id:int,
    db:Session = Depends(get_db)
):
    return delete_chat(chat_id=chat_id,db=db)
    