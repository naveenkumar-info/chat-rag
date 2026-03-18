#imports
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()
POSTGRES_URL = os.getenv("POSTGRES_URL")

#create engine
engine = create_engine(POSTGRES_URL)

#create session

session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#create base
Base = declarative_base()

#get db
def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()

#create tables

def create_table():
    Base.metadata.create_all(bind=engine)

