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
import httpx

async def get_embedding(text: str):
    try:
        print("in get emb")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "http://ollama:11434/api/embed", # 1. Changed from /api/embeddings
                json={
                    "model": "nomic-embed-text",
                    "input": text # 2. Changed from 'prompt' to 'input'
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            # 3. New API returns a list of embeddings in 'embeddings'
            if "embeddings" not in result or not result["embeddings"]:
                raise ValueError("Ollama response does not contain embedding data")
                
            # We take the first embedding in the list [0]
            return result["embeddings"][0]

    except Exception as e:
        print(f"Error in get_embedding: {str(e)}")
        return None


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
    try:
        if not isinstance(elements, list):
            raise ValueError("Input elements must be a list")

        sections = []
        current_section = {"title": "General", "content": []}

        for el in elements:
            # Ensure element has required keys to avoid KeyErrors
            if "type" not in el or "text" not in el:
                continue

            if el["type"] in ["Title", "Heading"]:
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": el["text"], "content": []}
            else:
                current_section["content"].append(el["text"])
        
        if current_section["content"]:
            sections.append(current_section)

        return sections

    except Exception as e:
        print(f"Error in group_by_section: {str(e)}")
        return []

#Chunking the file
def chunk_files(text):
    try:
        if not isinstance(text, list):
            raise ValueError("Input must be a list of sections")

        chunks = []

        for section in text:
            # Ensure the section has the required keys and content is a list
            if not all(key in section for key in ["title", "content"]):
                continue
            
            content_list = section.get("content", [])
            if not isinstance(content_list, list):
                continue

            full_text = " ".join(content_list)
            
            # Splitting text using the external text_splitter object
            split_text = text_splitter.split_text(full_text)

            for chunk in split_text:
                chunks.append({
                    "text": f"Section {section['title']} \n {chunk}",
                    "metadata": {
                        "section": section["title"]
                    }
                })

        return chunks

    except Exception as e:
        print(f"Error in chunk_files: {str(e)}")
        return []

#Embedding all the chunks
async def embed_chunks(chunks, batch_size=5):
    try:
        if not isinstance(chunks, list):
            raise ValueError("Input chunks must be a list")

        embedded = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]

            for chunk in batch:
                try:
                    # Basic key verification
                    raw_text = chunk.get("text")
                    if not raw_text:
                        continue

                    metadata = chunk.get("metadata", {})
                    text = clean_text(raw_text)

                    if not valid_chunk(text):
                        continue

                    embedding = await get_embedding(text)

                    embedded.append({
                        "text": text,
                        "embedding": embedding,
                        "metadata": metadata
                    })

                except Exception as inner_e:
                    print(f"Error processing individual chunk: {str(inner_e)}")
                    continue

        return embedded

    except Exception as e:
        print(f"Error in embed_chunks: {str(e)}")
        return []
# PDF
def parse_pdf(path):
    try:
        print("Extracting PDF")
        res = requests.get(path, timeout=30)
        res.raise_for_status()
        print("PDF downloaded")

        file_like = BytesIO(res.content)
        
        # Partitioning logic
        elements = partition_pdf(file=file_like)
        if not elements:
            return []

        merged_elements = []
    
        for el in elements:
            try:
                # Ensure element has necessary attributes before processing
                category = getattr(el, 'category', 'Unknown')
                text = getattr(el, 'text', '')
                metadata_obj = getattr(el, 'metadata', None)
                page_number = getattr(metadata_obj, 'page_number', None) if metadata_obj else None

                if (len(merged_elements) > 0 and 
                    category == merged_elements[-1]["type"] and 
                    page_number == merged_elements[-1]["metadata"].get("page_number")):
                    
                    merged_elements[-1]["text"] += f" {text}"
                else:
                    merged_elements.append({
                        "type": category,
                        "text": text,
                        "metadata": metadata_obj.to_dict() if hasattr(metadata_obj, 'to_dict') else {}
                    })
            except Exception as inner_e:
                print(f"Error processing PDF element: {str(inner_e)}")
                continue

        return merged_elements

    except Exception as e:
        print(f"Error in parse_pdf: {str(e)}")
        return []

# IMAGES
def parse_image(url):
    try:
        # Request with timeout to prevent hanging
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        file_like = BytesIO(res.content)
        print("parti img")
        # Partitioning the image using OCR
        elements = partition_image(
            file=file_like,
            strategy="hi_res",
            # Changed 'ocr_languages' to 'languages'
            languages=["eng"], 
            # Use "eng" (ISO 639-3) rather than "en" for better Tesseract compatibility
        )
        print("parti img done")
        if not elements:
            return []

        merged_elements = []
        
        for el in elements:
            try:
                # Extract attributes safely to avoid AttributeErrors
                category = getattr(el, 'category', 'UncategorizedText')
                text = getattr(el, 'text', '')
                metadata = getattr(el, 'metadata', None)
                page_number = getattr(metadata, 'page_number', None) if metadata else None
                coordinates = getattr(metadata, 'coordinates', None) if metadata else None

                if (merged_elements and 
                    category == merged_elements[-1]["type"] and 
                    page_number == merged_elements[-1]["metadata"].get("page_number")):
                    
                    merged_elements[-1]["text"] += f" {text}"
                else:
                    if category != "UncategorizedText":
                        merged_elements.append({
                            "type": category,
                            "text": text,
                            "metadata": {
                                "page_number": page_number,
                                "coordinates": coordinates
                            }
                        })
            except Exception as inner_e:
                print(f"Error processing image element: {str(inner_e)}")
                continue

        return merged_elements

    except Exception as e:
        print(f"Error in parse_image: {str(e)}")
        return []


# HTML + #grouping for the html files
def parse_html(url):
    try:
        print(f"Fetching HTML from: {url}")
        # Added timeout to prevent hanging on slow websites
        res = requests.get(url, timeout=15)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Remove non-content elements
        for noise in soup(["script", "style", "nav", "footer", "header"]):
            try:
                noise.decompose()
            except Exception:
                continue

        parsed = []
        
        # Extract meaningful content tags
        for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'tr']):
            try:
                text = tag.get_text(separator=' ').strip()
                if not text or len(text) < 3:
                    continue
                    
                if tag.name in ['h1', 'h2', 'h3', 'h4']:
                    category = "Title"
                elif tag.name == 'tr':
                    category = "NarrativeText" 
                    # Format table rows with pipe separators
                    cells = [td.get_text().strip() for td in tag.find_all(['td', 'th']) if td.get_text().strip()]
                    if not cells:
                        continue
                    text = " | ".join(cells)
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
            except Exception as inner_e:
                print(f"Error processing HTML tag: {str(inner_e)}")
                continue
        
        return parsed

    except Exception as e:
        print(f"Error in parse_html: {str(e)}")
        return []

def group_html_sections(elements):
    try:
        if not isinstance(elements, list):
            raise ValueError("Input elements must be a list")

        sections = []
        current_section = {"title": "General", "content": []}

        for el in elements:
            try:
                # Safely extract tag and text using dict.get()
                metadata = el.get("metadata", {})
                tag = metadata.get("tag", "")
                text = el.get("text", "").strip()

                if not text:
                    continue

                if tag in ["h1", "h2", "h3", "h4"]:
                    if current_section["content"]:
                        sections.append(current_section)

                    current_section = {
                        "title": text,
                        "content": []
                    }
                else:
                    current_section["content"].append(text)
            
            except Exception as inner_e:
                print(f"Error processing HTML element: {str(inner_e)}")
                continue

        if current_section["content"]:
            sections.append(current_section)

        return sections

    except Exception as e:
        print(f"Error in group_html_sections: {str(e)}")
        return []


#parcse excel + chunking excel
def parse_excel(url):
    try:
        # Request with timeout to prevent hanging
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        
        file_like = BytesIO(res.content)
        df = pd.read_excel(file_like)

        if df.empty:
            return []

        parsed = []

        for i, row in df.iterrows():
            try:
                row_dict = {}
                for col, val in row.items():
                    # Check for non-null values
                    if pd.notna(val):
                        # Round numerical values for cleaner strings
                        if isinstance(val, (float, int)):
                            val = round(val, 2)
                        row_dict[str(col)] = val

                if row_dict:
                    # Construct text representation of the row
                    row_text = ", ".join([f"{k}: {v}" for k, v in row_dict.items()])
                    
                    parsed.append({
                        "text": row_text,
                        "metadata": {
                            "source": url,
                            "row_index": i,
                            "filetype": "excel",
                            **row_dict   
                        }
                    })
            except Exception as inner_e:
                print(f"Error processing Excel row {i}: {str(inner_e)}")
                continue

        return parsed

    except Exception as e:
        print(f"Error in parse_excel: {str(e)}")
        return []

def chunk_excel_rows(elements):
    try:
        if not isinstance(elements, list):
            raise ValueError("Input elements must be a list")

        chunks = []

        for el in elements:
            try:
                # Safely extract text and metadata
                text = el.get("text", "")
                if not isinstance(text, str) or not text.strip():
                    continue

                # Ensure metadata exists and is a dictionary before copying
                raw_metadata = el.get("metadata", {})
                if not isinstance(raw_metadata, dict):
                    raw_metadata = {}
                
                metadata = raw_metadata.copy()

                chunks.append({
                    "text": text.strip(),
                    "metadata": metadata
                })

            except Exception as inner_e:
                print(f"Error processing individual excel row: {str(inner_e)}")
                continue

        return chunks

    except Exception as e:
        print(f"Error in chunk_excel_rows: {str(e)}")
        return []

# DOCX
def parse_docx(url):
    try:
        print(f"Downloading DOCX from: {url}")
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        
        file_like = BytesIO(res.content)
        doc = Document(file_like)
        
        parsed = []
        
        for para in doc.paragraphs:
            try:
                text = para.text.strip()
                if not text:
                    continue
                    
                category = "Title" if len(text) < 100 else "NarrativeText"
                
                if parsed and parsed[-1]["type"] == "Title" and category == "Title":
                    # Skip if it's a duplicate of the previous title
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
            except Exception as inner_e:
                print(f"Error processing DOCX paragraph: {str(inner_e)}")
                continue
        
        return parsed

    except Exception as e:
        print(f"Error in parse_docx: {str(e)}")
        return []
