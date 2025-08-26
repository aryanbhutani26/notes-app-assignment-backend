from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Note, User
from app.schemas import NoteCreate, NoteUpdate, NoteResponse, NotesListResponse
from app.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new note for the authenticated user
    
    - **title**: Note title (1-200 characters, required)
    - **content**: Note content (optional)
    
    Returns the created note with ID, timestamps, and version number.
    """
    try:
        # Create new note
        db_note = Note(
            title=note_data.title,
            content=note_data.content,
            user_id=current_user.id
        )
        
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        
        return db_note
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create note"
        )

@router.get("/", response_model=NotesListResponse)
async def get_user_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all notes for the authenticated user
    
    Returns a list of all notes belonging to the authenticated user.
    Notes are isolated by user - you can only see your own notes.
    """
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    return {"notes": notes}

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific note by ID for the authenticated user
    
    - **note_id**: The ID of the note to retrieve
    
    Returns 404 if the note doesn't exist or doesn't belong to you.
    """
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    return note

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a note with optimistic locking to prevent race conditions
    
    - **note_id**: The ID of the note to update
    - **title**: New note title (1-200 characters, required)
    - **content**: New note content (optional)
    - **version**: Current version number for optimistic locking (required)
    
    Returns 409 Conflict if the note was modified by another process.
    Get the latest version and try again if you receive this error.
    """
    # Get the current note
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Check version for optimistic locking
    if note.version != note_update.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note was modified by another process. Please refresh and try again."
        )
    
    try:
        # Update note fields
        note.title = note_update.title
        note.content = note_update.content
        note.version += 1
        
        db.commit()
        db.refresh(note)
        
        return note
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update note"
        )

@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a note for the authenticated user
    
    - **note_id**: The ID of the note to delete
    
    Returns 404 if the note doesn't exist or doesn't belong to you.
    This operation cannot be undone.
    """
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    try:
        db.delete(note)
        db.commit()
        
        return {"message": "Note deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete note"
        )