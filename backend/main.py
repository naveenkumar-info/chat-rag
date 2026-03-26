from fastapi import FastAPI, Form, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from Services.files import get_answer,upload_file,delete_file,check_chroma_size,del_all_chroma
from models import files
from db import get_db

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

# POST METHODS

#uploading the fil PG + Chroma
@app.post("/uploadfile/")
async def upload_file_DB(
    db:Session = Depends(get_db),
    file:UploadFile = File(...),
    
    ):
    return upload_file(db,file)

@app.post("/ask-question")
async def ask_question(query:str = Form(...)):
    return get_answer(query)


# GET METHODS

#get all the files
@app.get("/files/")
async def get_files(db:Session = Depends(get_db)):
    return db.query(files).all()

#check chroma size - TESTING
@app.get("/check-size-chroma")
async def get_file_size(db:Session = Depends(get_db)):
    return check_chroma_size()

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
