from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Note title")
    content: Optional[str] = Field(None, description="Note content")

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    version: int = Field(..., description="Current version for optimistic locking")

class NoteResponse(NoteBase):
    id: int
    user_id: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotesListResponse(BaseModel):
    notes: list[NoteResponse]