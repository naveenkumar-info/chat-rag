from models import files
from sqlalchemy.orm import Session
from config.cloudinary import cloudinary
from fastapi import UploadFile
from cloudinary import uploader
from Services.Chat import get_embedding,embed_chunks,group_html_sections,group_by_section,chunk_files,chunk_excel_rows,parse_docx,parse_html,parse_image,parse_pdf,parse_excel
from Services.chroma_service import ChromaService
import requests

#instance of chroma
chroma = ChromaService()

# File parsing - parse + group + chunking
def parse_file(file_path,file_type): 

    if "pdf" in file_type:
        parse = parse_pdf(file_path)
        groups = group_by_section(parse)
        chunks = chunk_files(groups)
        return chunks
    
    elif "image" in file_type:
        parse = parse_image(file_path)
        groups = group_by_section(parse)
        chunks = chunk_files(groups)
        return chunks

    elif "html" in file_type:
        parse = parse_html(file_path)
        groups = group_html_sections(parse)
        chunks = chunk_files(groups)
        return chunks

    elif "spreadsheet" in file_type:
        parse = parse_excel(file_path)
        chunks = chunk_excel_rows(parse)
        return chunks

    elif "document" in file_type:
        parse = parse_docx(file_path)
        groups = group_by_section(parse)
        chunks = chunk_files(groups)
        return chunks
    else:
        raise ValueError("Unsupported file type",file_type)
    
# uploading the file - PG + CHROMA + Cloudinary
def upload_file(db: Session, file:UploadFile):
    # storing file in cloudinary
    result = cloudinary.uploader.upload(file.file,access_mode="public", folder="rag", resource_type="auto")

    # retrieving url,format and id
    file_urls = result["secure_url"]
    file_format = result.get("format") or file.filename.split(".")[-1]
    public_id = result["public_id"]

    # identifying the file type
    if file_format in ["pdf"]:
        resource = "pdf"
    elif file_format in ["jpg","jpeg","png"]:
        resource = "image"
    elif file_format in ["docx"]:
        resource = "document"
    elif file_format in ["xlsx"]:
        resource = "spreadsheet"
    else:
        resource= "html"

    # new file added in pg DB
    new_file = files(
        filename=file.filename,
        file_url=file_urls,
        file_type=file_format,
        public_id=public_id  
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    # parsed
    parsed_data = parse_file(file_urls,resource)
    # embedd
    embeddings = embed_chunks(parsed_data)
    # stored in the chromaDB 
    ChromaService.store(chroma,embeddings,new_file.id)



    return new_file

# Used during testing to know chroma upload / delete are working
def check_chroma_size():
    size = chroma.collection.count()

    return size

# Delete files from PG + CHROMA using file_id created in the PG and stored in the chroma metadata
def delete_file(db:Session,file_id:int):

    #get the file by id
    file = db.query(files).filter(files.id == file_id).first()

    if file:
        # Use the stored public_id from the database to delete from cloudinary
        public_id = file.public_id
        file_type = file.file_type
        
        if file_type in ["pdf","docx","xlsx"]:
            resource = "raw"
        elif file_type in ["jpg","jpeg","png"]:
            resource = "image"
        else:
            resource = "raw"

        #Deleting from cloudinary
        cloudinary.uploader.destroy(public_id, resource_type=resource)

        #Deleting from the chroma
        ChromaService.delete(chroma,file_id)

        #Deleting from the PG
        db.delete(file)
        db.commit()
        
        return {"message": "File deleted successfully"}
    else:
        raise ValueError("File not found")
    
# used during testing - delete all chroma files at once
def del_all_chroma():
    ChromaService.delete_all(chroma)

def get_answer(query:str):
    query_embedd = get_embedding(query)

    results = chroma.search(
        query_embed=query_embedd,
        top_k=5,
        
    )

    if not results:
        return{
            "answer":"No relevant information found",
            "sources":[]
        }
    
    context = "\n\n".join([r["text"] for r in results ])

    prompt = f"""

        You are a helpful AI assistant

        Answer only from the given context.
        If the answer is not present, say "I dont know"

        Context:
        {context}

        Question:
        {query}

        Answer:

            """

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model":"llama3.2",
            "prompt":prompt,
            "stream":False
        }
    )


    answer = response.json()

    return{
        "answer":answer,
        "sources":results
    }