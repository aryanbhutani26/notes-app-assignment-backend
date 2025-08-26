import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, Note
from datetime import datetime

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_user_model(db_session):
    """Test User model creation and relationships"""
    user = User(
        username="testuser",
        password_hash="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    assert user.id is not None
    assert user.username == "testuser"
    assert user.password_hash == "hashed_password"
    assert user.created_at is not None
    assert user.notes == []

def test_note_model(db_session):
    """Test Note model creation and relationships"""
    # Create user first
    user = User(username="testuser", password_hash="hashed_password")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create note
    note = Note(
        title="Test Note",
        content="This is a test note",
        user_id=user.id
    )
    db_session.add(note)
    db_session.commit()
    db_session.refresh(note)
    
    assert note.id is not None
    assert note.title == "Test Note"
    assert note.content == "This is a test note"
    assert note.user_id == user.id
    assert note.version == 1
    assert note.created_at is not None
    assert note.updated_at is not None
    assert note.owner.username == "testuser"

def test_user_note_relationship(db_session):
    """Test the relationship between User and Note models"""
    user = User(username="testuser", password_hash="hashed_password")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Add multiple notes
    note1 = Note(title="Note 1", content="Content 1", user_id=user.id)
    note2 = Note(title="Note 2", content="Content 2", user_id=user.id)
    
    db_session.add_all([note1, note2])
    db_session.commit()
    
    # Refresh user to load notes
    db_session.refresh(user)
    
    assert len(user.notes) == 2
    assert user.notes[0].title in ["Note 1", "Note 2"]
    assert user.notes[1].title in ["Note 1", "Note 2"]