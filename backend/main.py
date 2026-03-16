from fastapi import FastAPI, Form, File, UploadFile
import tempfile
from pypdf import PdfReader
from Services.Chat import get_context,create_vector
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

OLLAMA_API = "http://localhost:11434/api/generate"

origins = ["http://localhost:3000","http://192.168.0.239:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text(pathname):
    render = PdfReader(pathname)

    text=""
    for page in render.pages:
        text+=page.extract_text()
    
    return text


@app.post("/ask")
async def ask_question(

    file:UploadFile = File(...),
    question: str = Form(...),

):
    #save the file

    with tempfile.TemporaryFile(delete=False) as temp:
        context = await file.read()
        temp.write(context)
        path = temp.name

    #extract text from pdf

    text = extract_text(path)

    print("Data extracted")

    #create vector DB
    vectorstore = create_vector(text)

    print("Data vectorized")

    #get the relevant chunks 
    content = get_context(vectorstore,question)

    print("Data content")


    ##prompt

    prompt = f"""
    Answer the question

    Content:{content}

    Question:{question}

    """

    #give the response

    res = requests.post(
        OLLAMA_API,
        json={
            "model":"llama3.2:3b",
            "prompt":prompt,
            "stream":False
        }
    )

    return res.json()
