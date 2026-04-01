#imports

from db import Base
from sqlalchemy import Column, DateTime, Integer,DateTime, LargeBinary, String, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship

class files(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    file_url = Column(String,nullable=False)
    file_type = Column(String,nullable=False)
    public_id = Column(String, nullable=False)  # Store Cloudinary public_id for deletion
    created_at = Column(DateTime,default=datetime.utcnow)
  
class Chat(Base):
    __tablename__ = "chats"

    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    messages = relationship("Message",backref="chat")

class Message(Base):
    __tablename__ = "messages"

    id=Column(Integer,primary_key=True,index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    role=Column(String)
    content=Column(String)
    created_at=Column(DateTime,default=datetime.utcnow)