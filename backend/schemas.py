from pydantic import BaseModel
from datetime import datetime


class FileResponse(BaseModel):
    id: int
    filename: str
    file_url: str
    file_type: str
    created_at: datetime

    class Config:
        from_attribute = True

