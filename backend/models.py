#imports

from db import Base
from sqlalchemy import Column, DateTime, Integer, LargeBinary, String
from datetime import datetime

class files(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    file_url = Column(String,nullable=False)
    file_type = Column(String,nullable=False)
    public_id = Column(String, nullable=False)  # Store Cloudinary public_id for deletion
    created_at = Column(DateTime,default=datetime.utcnow)
  