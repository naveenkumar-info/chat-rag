from models import File
from sqlalchemy.orm import Session
from config.cloudinary import cloudinary
from fastapi import UploadFile
from Services.embedding import embed_chunks
from Services.parsing import group_html_sections,group_by_section,chunk_files,chunk_excel_rows,parse_docx,parse_html,parse_image,parse_pdf,parse_excel


from Services.Chroma_service import ChromaService

import asyncio


#instance of chroma
chroma = ChromaService()

# File parsing - parse + group + chunking
def parse_file(file_path, file_type):
    try:
        # Normalize the file_type string for easier comparison
        file_type = file_type.lower()
        chunks = []

        if "pdf" in file_type:
            parse = parse_pdf(file_path)
            print("pdf parsed",parse[0],flush=True)
            groups = group_by_section(parse)
            print("groups: ",groups[0],flush=True)
            chunks = chunk_files(groups)
            print("chunks: ",chunks[0],flush=True)
        
        elif "image" in file_type:
            parse = parse_image(file_path)
            groups = group_by_section(parse)
            chunks = chunk_files(groups)

        elif "html" in file_type:
            parse = parse_html(file_path)
            groups = group_html_sections(parse)
            chunks = chunk_files(groups)

        elif "spreadsheet" in file_type:
            parse = parse_excel(file_path)
            chunks = chunk_excel_rows(parse)

        elif "document" in file_type:
            parse = parse_docx(file_path)
            groups = group_by_section(parse)
            chunks = chunk_files(groups)
            
        else:
            print(f"Unsupported file type encountered: {file_type}")
            raise ValueError(f"Unsupported file type: {file_type}")

        # Return the processed chunks if successfully generated
        return chunks

    except Exception as e:
        # Standardized error logging for any failure in the parsing pipeline
        print(f"Error in parse_file pipeline: {str(e)}")
        # Re-raising for the service layer to handle the specific failure
        raise Exception(f"File parsing failed: {str(e)}")

async def upload_file(db: Session, file: UploadFile, clerk_id: str):
    public_id = None # Track this for cleanup
    try:
        file.file.seek(0)
        # 1. Cloudinary Upload
        result = cloudinary.uploader.upload(
            file.file, 
            folder="rag", 
            resource_type="auto"
        )
        file_url = result.get("secure_url")
        public_id = result.get("public_id")
        file_format = (result.get("format") or file.filename.split(".")[-1]).lower()

         # 3. Identify the resource category for the parser

        if file_format in ["pdf"]:

            resource = "pdf"

        elif file_format in ["jpg", "jpeg", "png"]:

            resource = "image"

        elif file_format in ["docx"]:

            resource = "document"

        elif file_format in ["xlsx"]:

            resource = "spreadsheet"

        else:

            resource = "html"

        # 2. Database Record
        new_file = File(
            alembic_version="1.0.0",
            clerk_id=clerk_id['clerk_id'],
            filename=file.filename,
            file_url=file_url,
            file_type=file_format,
            public_id=public_id  
        )
        db.add(new_file)
        
        # We use flush here so we have new_file.id for Chroma
        db.flush() 

        # 3. RAG Pipeline 
        # Move this INSIDE the main try block if you want to fail everything 
        # if the vector store fails.
        try:
            loop = asyncio.get_running_loop()
            parsed_data = await loop.run_in_executor(None, parse_file, file_url, resource)
            embeddings = await embed_chunks(parsed_data)
            
            if embeddings:
                await chroma.store(embeddings, new_file.id)
            
            # ONLY COMMIT IF EVERYTHING (Cloud + DB + Chroma) SUCCEEDED
            db.commit() 
            db.refresh(new_file)
            return new_file

        except Exception as pipeline_error:
            # If RAG fails, we treat the whole upload as a failure
            print(f"RAG Error: {pipeline_error}")
            raise pipeline_error 

    except Exception as e:
        db.rollback() # Undo Postgres
        
        if public_id:
            # Undo Cloudinary: Delete the file if it was uploaded
            cloudinary.uploader.destroy(public_id)
            print(f"Cleaned up Cloudinary file: {public_id}")
            
        print(f"Upload failed: {str(e)}")
        raise e

# Delete files from PG + CHROMA using file_id created in the PG and stored in the chroma metadata
def delete_file(db: Session, file_id: int, clerk_id: str):
    try:
        # 1. Fetch the file record from Postgres
        file = db.query(File).filter(File.id == file_id).first()

        print("found file: ", file)

        if not file:
            raise ValueError(f"File with id {file_id} not found")
        
        if file.clerk_id != clerk_id:
            raise PermissionError("Unauthorized: You do not have permission to delete this file")

        # 2. Determine Cloudinary resource type
        # Cloudinary uses 'raw' for PDF, DOCX, and XLSX, and 'image' for photos
        file_type = file.file_type.lower() if file.file_type else ""
        
        if file_type in ["jpg", "jpeg", "png"]:
            resource = "image"
        else:
            resource = "raw"

        # 3. Delete from Cloudinary
        try:
            cloudinary.uploader.destroy(file.public_id, resource_type=resource)
        except Exception as cloud_e:
            print(f"Warning: Cloudinary deletion failed: {str(cloud_e)}")

        # 4. Delete from ChromaDB (Vector Store)
        try:
            chroma.delete(file_id)
        except Exception as chroma_e:
            print(f"Warning: ChromaDB deletion failed: {str(chroma_e)}")

        # 5. Delete from Postgres
        db.delete(file)
        db.commit()
        
        return {"message": "File and associated data deleted successfully"}

    except Exception as e:
        # Rollback Postgres transaction if the database delete fails
        db.rollback()
        print(f"Error in delete_file: {str(e)}")
        raise Exception(f"Failed to delete file: {str(e)}")


