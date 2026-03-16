from pydoc import html

from fastapi import FastAPI, Form, File, UploadFile
import tempfile
from pypdf import PdfReader
from Services.Chat import get_context,create_vector,extract_image,extract_pdf,extract_html,extract_excel,extract_docx
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

def extract_text(file_path,file_type): 

    

    if "pdf" in file_type:
        return extract_pdf(file_path)
    
    elif "image" in file_type:
        return extract_image(file_path)

    elif "html" in file_type:
        return extract_html(file_path)

    elif "spreadsheet" in file_type:
        return extract_excel(file_path)

    elif "document" in file_type:
        return extract_docx(file_path)
    else:
        
        raise ValueError("Unsupported file type",file_type)



@app.post("/ask")
async def ask_question(

    file:UploadFile = File(...),
    question: str = Form(...),

):
    #save the file

    file_type = file.content_type

    with tempfile.NamedTemporaryFile(delete=False) as temp:
        content = await file.read()
        temp.write(content)

        file_path = temp.name

    #extract text from pdf

    text = extract_text(file_path,file_type)

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
