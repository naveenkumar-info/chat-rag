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
from unstructured.partition.pdf import partition_pdf
import requests
import tempfile
from io import BytesIO
from unstructured.partition.image import partition_image


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
    print("Extracting PDF")
    res = requests.get(path)
    res.raise_for_status() 
    print("PDF downloaded")

    file_like = BytesIO(res.content)
    
 
    elements = partition_pdf(file=file_like) 

    full_text = "\n".join([str(el) for el in elements])
    return full_text



def extract_image(url):
    res = requests.get(url)
    res.raise_for_status()
    file_like = BytesIO(res.content)


    elements = partition_image(
        file=file_like,
        strategy="hi_res",
        ocr_languages=["en"], # 'en' is the code for Paddle
    )
    return "\n".join([str(el) for el in elements])

def extract_html(url):
    print(f"Fetching HTML from: {url}")
    
    # 1. Download the HTML content
    res = requests.get(url)
    res.raise_for_status() # Ensure the link is valid
    
    # 2. Get the text content directly from the response
    html_content = res.text 
    
    # 3. Pass the string to BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 4. Clean up the text (removes script and style tags)
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()

    # get_text() with a separator makes sure words don't get smashed together
    text = soup.get_text(separator=' ')
    
    # Clean up extra whitespace
    clean_text = " ".join(text.split())

    return clean_text



def extract_excel(url):
    print(f"Downloading Excel from: {url}")
    
    # 1. Get the raw bytes from Cloudinary
    res = requests.get(url)
    res.raise_for_status()
    
    # 2. Wrap in BytesIO so Pandas thinks it's a file
    file_like = BytesIO(res.content)
    
    # 3. Read the Excel file

    df = pd.read_excel(file_like)
    
    # 4. Convert to string
  
    text = df.to_string(index=False)
    
    return text



def extract_docx(url):
    print(f"Downloading DOCX from: {url}")
    
    # 1. Fetch the document from Cloudinary
    res = requests.get(url)
    res.raise_for_status()
    
    # 2. Wrap the binary content in BytesIO
    
    file_like = BytesIO(res.content)
    
    # 3. Load the document
    doc = Document(file_like)
    
    # 4. Extract text with better spacing
  
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    
 
    text = "\n".join(paragraphs)
    
    return text


