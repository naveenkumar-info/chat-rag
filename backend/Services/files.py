from models import files
from sqlalchemy.orm import Session
from config.cloudinary import cloudinary
from fastapi import UploadFile
from cloudinary import uploader

def upload_file(db: Session, file:UploadFile):

    result = cloudinary.uploader.upload(file.file,access_mode="public", folder="rag", resource_type="auto")

    file_urls = result["secure_url"]
    file_format = result.get("format") or file.filename.split(".")[-1]
    public_id = result["public_id"]  # Get public_id from Cloudinary response

    new_file = files(
        filename=file.filename,
        file_url=file_urls,
        file_type=file_format,
        public_id=public_id  # Store the public_id
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return new_file


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