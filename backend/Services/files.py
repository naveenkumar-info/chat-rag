from models import files
from sqlalchemy.orm import Session
from config.cloudinary import cloudinary
from fastapi import UploadFile
from cloudinary import uploader
from Services.Chat import embed_chunks,group_html_sections,group_by_section,chunk_files,chunk_excel_rows,parse_docx,parse_html,parse_image,parse_pdf,parse_excel
import requests
from io import BytesIO

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

from Services.Chat import extract_html, extract_pdf, extract_docx,extract_image, extract_excel

def upload_file(db: Session, file:UploadFile):

    result = cloudinary.uploader.upload(file.file,access_mode="public", folder="rag", resource_type="auto")

    file_urls = result["secure_url"]
    file_format = result.get("format") or file.filename.split(".")[-1]
    public_id = result["public_id"]

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

    parsed_data = parse_file(file_urls,resource)

    print("PARSED")
    print("PARSED")
    print("PARSED")
    print("PARSED")
    print("PARSED")

    embeddings = embed_chunks(parsed_data)


    print("Extracted text:")  
    # new_file = files(
    #     filename=file.filename,
    #     file_url=file_urls,
    #     file_type=file_format,
    #     public_id=public_id  # Store the public_id
    # )

    # db.add(new_file)
    # db.commit()
    # db.refresh(new_file)
    return embeddings


def delete_file(db:Session,file_id:int):
    file = db.query(files).filter(files.id == file_id).first()

    if file:
        # Use the stored public_id from the database
        public_id = file.public_id
        file_type = file.file_type
        
        if file_type in ["pdf","docx","xlsx"]:
            resource = "raw"
        elif file_type in ["jpg","jpeg","png"]:
            resource = "image"
        else:
            resource = "raw"
        print("public_id for deletion:", public_id)
        print("resource type for deletion:", resource)

        cloudinary.uploader.destroy(public_id, resource_type=resource)
        db.delete(file)
        db.commit()
        
        return {"message": "File deleted successfully"}
    else:
        raise ValueError("File not found")