from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from bs4 import BeautifulSoup
import pandas as pd
from docx import Document
from unstructured.partition.pdf import partition_pdf
import requests
from io import BytesIO
from unstructured.partition.image import partition_image

# Extracting the embedding
def get_embedding(text:str):

    response = requests.post(
        "http://localhost:11434/api/embeddings",
        json={
            "model":"nomic-embed-text",
            "prompt":text
        }
    )

    if response.status_code != 200:
        raise Exception(f"Embedding failed: {response.text}")

    return response.json()["embedding"]

#Cleaning the text
def clean_text(text):
    return text.strip().replace("\n"," ")
  
#Only including the valid chunks to remove the noise
def valid_chunk(text):
    return len(text) > 30

#text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 500,
    chunk_overlap = 50
)

#Grouping the file text based on the sections before chunking
def group_by_section(elements):
    sections=[]

    current_section = {"title": "General", "content": []}

    for el in elements:
        if el["type"] in ["Title", "Heading"]:
            if current_section["content"]:
                sections.append(current_section)
            current_section = {"title": el["text"], "content": []}
        else:
            current_section["content"].append(el["text"])
    
    if current_section["content"]:
        sections.append(current_section)

    return sections


#Chunking the file
def chunk_files(text):

    chunks = []

    for section in text:
        full_text = " ".join(section["content"])
        split_text = text_splitter.split_text(full_text)

        for chunk in split_text:
            chunks.append({
                "text": f"Section {section['title']} \n {chunk}",
                "metadata": {
                    "section": section["title"]
                }
            })
    
    

    return chunks


#Embedding all the chunks
def embed_chunks(chunks,batch_size=5):
    embedded=[]
    for i in range(0,len(chunks),batch_size):
        batch = chunks[i:i + batch_size]

        for chunk in batch:
            raw_text = chunk["text"]
            metadata = chunk.get("metadata",{})

            text = clean_text(raw_text)

            if not valid_chunk(text):
                continue

            try:
                embedding = get_embedding(text)

                embedded.append({
                    "text":text,
                    "embedding":embedding,
                    "metadata":metadata
                })

            except Exception as e:
                print(f"Embedding error: {e}")


    return embedded

# PDF
def parse_pdf(path):
    print("Extracting PDF")
    res = requests.get(path)
    res.raise_for_status() 
    print("PDF downloaded")

    file_like = BytesIO(res.content)
 
    elements = partition_pdf(file=file_like) 

    merged_elements = []
    
    for el in elements:
     
        if (len(merged_elements) > 0 and 
            el.category == merged_elements[-1]["type"] and 
            el.metadata.page_number == merged_elements[-1]["metadata"].get("page_number")):
            
          
            merged_elements[-1]["text"] += f" {el.text}"
           
            if (el.metadata and 
                hasattr(el.metadata, 'coordinates') and 
                el.metadata.coordinates):
                
                pass 
        else:
           
            merged_elements.append({
                "type": el.category,
                "text": el.text,
                "metadata": el.metadata.to_dict() if el.metadata else {}
            })

    return merged_elements

# IMAGES
def parse_image(url):
    res = requests.get(url)
    res.raise_for_status()
    file_like = BytesIO(res.content)


    elements = partition_image(
        file=file_like,
        strategy="hi_res",
        ocr_languages=["en"], 
    )

    merged_elements = []
    
    for el in elements:
        
        if (merged_elements and 
            el.category == merged_elements[-1]["type"] and 
            el.metadata.page_number == merged_elements[-1]["metadata"].get("page_number")):
            
            
            merged_elements[-1]["text"] += f" {el.text}"
            
            
            if "coordinates" in merged_elements[-1]["metadata"] and el.metadata.coordinates:
               
                pass 
        else:
            if el.category != "UncategorizedText":
                merged_elements.append({
                    "type": el.category,
                    "text": el.text,
                    "metadata": {
                        "page_number": el.metadata.page_number,
                        "coordinates": el.metadata.coordinates
                    }
                })


    return merged_elements

# HTML + #grouping for the html files
def parse_html(url):
    print(f"Fetching HTML from: {url}")
    res = requests.get(url)
    res.raise_for_status()
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    
    for noise in soup(["script", "style", "nav", "footer", "header"]):
        noise.decompose()

    parsed = []
    
    
    for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'tr']):
        text = tag.get_text(separator=' ').strip()
        if not text or len(text) < 3:
            continue
            
        
        if tag.name in ['h1', 'h2', 'h3', 'h4']:
            category = "Title"
        elif tag.name == 'tr':
            category = "NarrativeText" 
            
            text = " | ".join([td.get_text().strip() for td in tag.find_all(['td', 'th']) if td.get_text().strip()])
        else:
            category = "NarrativeText"

        parsed.append({
            "type": category,
            "text": text,
            "metadata": {
                "source": url,
                "tag": tag.name,
                "filetype": "text/html"
            }
        })
    
    return parsed
def group_html_sections(elements):
    sections = []
    current_section = {"title": "General", "content": []}

    for el in elements:
        tag = el["metadata"].get("tag", "")
        text = el["text"].strip()

       
        if tag in ["h1", "h2", "h3", "h4"]:
            if current_section["content"]:
                sections.append(current_section)

            current_section = {
                "title": text,
                "content": []
            }
        else:
            current_section["content"].append(text)

    if current_section["content"]:
        sections.append(current_section)

    return sections

#parcse excel + chunking excel
def parse_excel(url):
    res = requests.get(url)
    res.raise_for_status()
    
    file_like = BytesIO(res.content)
    df = pd.read_excel(file_like)

    if df.empty:
        return []

    parsed = []

    for i, row in df.iterrows():
        row_dict = {}

        for col, val in row.items():
            if pd.notna(val):
                if isinstance(val, (float, int)):
                    val = round(val, 2)
                row_dict[col] = val

        if row_dict:
            parsed.append({
                "text": ", ".join([f"{k}: {v}" for k, v in row_dict.items()]),
                "metadata": {
                    "source": url,
                    "row_index": i,
                    "filetype": "excel",
                    **row_dict   
                }
            })

    return parsed
def chunk_excel_rows(elements):
    chunks = []

    for el in elements:
        text = el["text"]

        if not text.strip():
            continue

       
        metadata = el["metadata"].copy()

        chunks.append({
            "text": text,
            "metadata": metadata
        })

    return chunks

# DOCX
def parse_docx(url):
    print(f"Downloading DOCX from: {url}")
    res = requests.get(url)
    res.raise_for_status()
    
    file_like = BytesIO(res.content)
    doc = Document(file_like)
    
    parsed = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
            
       
        category = "Title" if len(text) < 100 else "NarrativeText"
        
       
        if parsed and parsed[-1]["type"] == "Title" and category == "Title":
           
            if text.lower() == parsed[-1]["text"].lower():
                continue 
            
            
            parsed[-1]["text"] += f": {text}"

        
        else:
            parsed.append({
                "type": category,
                "text": text,
                "metadata": {
                    "source": url,
                    "filetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
            })
    
    return parsed