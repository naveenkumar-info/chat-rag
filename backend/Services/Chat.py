from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
import os
from pypdf import PdfReader
import easyocr
# import pytessaract
from PIL import Image
from bs4 import BeautifulSoup
import pandas as pd
from docx import Document

embedding_model = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434"
                                   
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 500,
    chunk_overlap = 50
)

def create_vector(text):

    chunks = text_splitter.split_text(text)

    vectorstore = Chroma.from_texts(
        chunks,
        embedding_model
    )

    return vectorstore

def get_context(vectorstore,question):
    docs = vectorstore.similarity_search(question,k=3)

    context = "\n".join([doc.page_content for doc in docs])

    return context


def extract_pdf(path):
    reader = PdfReader(path)

    text=""
    for page in reader.pages:
        text+=page.extract_text()

    return text

def extract_image(path):
    img = Image.open(path)
    reader = easyocr.Reader(['en'])
    result = reader.readtext(img)
    text = ""
    for res in result:
        text+=res[1] + " "
    return text

def extract_html(path):
    with open(path,'r',encoding="utf-8") as f:
        soup = BeautifulSoup(f,'html.parser')
        text = soup.get_text()

    return text

def extract_excel(path):
    df = pd.read_excel(path)
    text = df.to_string()
    return text

def extract_docx(path):
    doc = Document(path)
    text=""
    for para in doc.paragraphs:
        text+=para.text

    return text


