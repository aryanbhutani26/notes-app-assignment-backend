import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, Note
from app.services.auth import hash_password, create_access_token
import threading
import time

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration_notes.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_user(db_session):
    """Create a test user and return auth headers"""
    user = User(
        username="testuser",
        password_hash=hash_password("testpass123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = create_access_token({"user_id": user.id, "username": user.username})
    headers = {"Authorization": f"Bearer {token}"}
    
    return {"user": user, "headers": headers}

def test_complete_note_lifecycle(client, auth_user):
    """Test complete CRUD lifecycle for notes"""
    headers = auth_user["headers"]
    
    # Step 1: Create a note
    note_data = {
        "title": "Test Note",
        "content": "This is a test note content"
    }
    
    create_response = client.post("/notes/", json=note_data, headers=headers)
    assert create_response.status_code == 201
    created_note = create_response.json()
    
    assert created_note["title"] == note_data["title"]
    assert created_note["content"] == note_data["content"]
    assert created_note["version"] == 1
    assert "id" in created_note
    assert "created_at" in created_note
    assert "updated_at" in created_note
    
    note_id = created_note["id"]
    
    # Step 2: Read the note
    get_response = client.get(f"/notes/{note_id}", headers=headers)
    assert get_response.status_code == 200
    retrieved_note = get_response.json()
    assert retrieved_note["id"] == note_id
    assert retrieved_note["title"] == note_data["title"]
    
    # Step 3: Update the note
    update_data = {
        "title": "Updated Test Note",
        "content": "This is updated content",
        "version": retrieved_note["version"]
    }
    
    update_response = client.put(f"/notes/{note_id}", json=update_data, headers=headers)
    assert update_response.status_code == 200
    updated_note = update_response.json()
    
    assert updated_note["title"] == update_data["title"]
    assert updated_note["content"] == update_data["content"]
    assert updated_note["version"] == 2  # Version should increment
    
    # Step 4: Delete the note
    delete_response = client.delete(f"/notes/{note_id}", headers=headers)
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Note deleted successfully"
    
    # Step 5: Verify note is deleted
    get_deleted_response = client.get(f"/notes/{note_id}", headers=headers)
    assert get_deleted_response.status_code == 404

def test_list_user_notes(client, auth_user):
    """Test listing user notes"""
    headers = auth_user["headers"]
    
    # Initially no notes
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 200
    assert response.json()["notes"] == []
    
    # Create multiple notes
    notes_data = [
        {"title": "Note 1", "content": "Content 1"},
        {"title": "Note 2", "content": "Content 2"},
        {"title": "Note 3", "content": "Content 3"}
    ]
    
    created_notes = []
    for note_data in notes_data:
        response = client.post("/notes/", json=note_data, headers=headers)
        assert response.status_code == 201
        created_notes.append(response.json())
    
    # List all notes
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 200
    notes_list = response.json()["notes"]
    assert len(notes_list) == 3
    
    # Verify all notes are present
    titles = [note["title"] for note in notes_list]
    assert "Note 1" in titles
    assert "Note 2" in titles
    assert "Note 3" in titles

def test_user_isolation(client, db_session):
    """Test that users can only access their own notes"""
    # Create two users
    user1 = User(username="user1", password_hash=hash_password("pass123"))
    user2 = User(username="user2", password_hash=hash_password("pass123"))
    
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)
    
    # Create tokens for both users
    token1 = create_access_token({"user_id": user1.id, "username": user1.username})
    token2 = create_access_token({"user_id": user2.id, "username": user2.username})
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User1 creates a note
    note_data = {"title": "User1 Note", "content": "User1 content"}
    response = client.post("/notes/", json=note_data, headers=headers1)
    assert response.status_code == 201
    note_id = response.json()["id"]
    
    # User2 cannot see User1's note in their list
    response = client.get("/notes/", headers=headers2)
    assert response.status_code == 200
    assert len(response.json()["notes"]) == 0
    
    # User2 cannot access User1's note directly
    response = client.get(f"/notes/{note_id}", headers=headers2)
    assert response.status_code == 404
    
    # User2 cannot update User1's note
    update_data = {"title": "Hacked", "content": "Hacked content", "version": 1}
    response = client.put(f"/notes/{note_id}", json=update_data, headers=headers2)
    assert response.status_code == 404
    
    # User2 cannot delete User1's note
    response = client.delete(f"/notes/{note_id}", headers=headers2)
    assert response.status_code == 404
    
    # User1 can still access their note
    response = client.get(f"/notes/{note_id}", headers=headers1)
    assert response.status_code == 200
    assert response.json()["title"] == "User1 Note"

def test_optimistic_locking_race_condition(client, auth_user):
    """Test optimistic locking prevents race conditions"""
    headers = auth_user["headers"]
    
    # Create a note
    note_data = {"title": "Race Test Note", "content": "Original content"}
    response = client.post("/notes/", json=note_data, headers=headers)
    assert response.status_code == 201
    note = response.json()
    note_id = note["id"]
    original_version = note["version"]
    
    # Simulate race condition: two updates with same version
    update_data_1 = {
        "title": "Update 1",
        "content": "Content from update 1",
        "version": original_version
    }
    
    update_data_2 = {
        "title": "Update 2", 
        "content": "Content from update 2",
        "version": original_version  # Same version as update 1
    }
    
    # First update should succeed
    response1 = client.put(f"/notes/{note_id}", json=update_data_1, headers=headers)
    assert response1.status_code == 200
    updated_note = response1.json()
    assert updated_note["version"] == original_version + 1
    assert updated_note["title"] == "Update 1"
    
    # Second update with stale version should fail
    response2 = client.put(f"/notes/{note_id}", json=update_data_2, headers=headers)
    assert response2.status_code == 409
    assert "modified by another process" in response2.json()["detail"]
    
    # Verify the note still has the first update
    response = client.get(f"/notes/{note_id}", headers=headers)
    assert response.status_code == 200
    final_note = response.json()
    assert final_note["title"] == "Update 1"
    assert final_note["version"] == original_version + 1

def test_note_validation_errors(client, auth_user):
    """Test validation errors for note operations"""
    headers = auth_user["headers"]
    
    # Test creating note with invalid data
    invalid_note_data = {
        "title": "",  # Empty title should fail
        "content": "Valid content"
    }
    
    response = client.post("/notes/", json=invalid_note_data, headers=headers)
    assert response.status_code == 422
    
    # Test creating note with title too long
    long_title = "x" * 201  # Exceeds 200 character limit
    invalid_note_data = {
        "title": long_title,
        "content": "Valid content"
    }
    
    response = client.post("/notes/", json=invalid_note_data, headers=headers)
    assert response.status_code == 422

def test_note_operations_without_authentication(client):
    """Test that note operations require authentication"""
    # Test all note endpoints without authentication
    
    # Create note
    response = client.post("/notes/", json={"title": "Test", "content": "Test"})
    assert response.status_code == 403
    
    # List notes
    response = client.get("/notes/")
    assert response.status_code == 403
    
    # Get specific note
    response = client.get("/notes/1")
    assert response.status_code == 403
    
    # Update note
    response = client.put("/notes/1", json={"title": "Test", "content": "Test", "version": 1})
    assert response.status_code == 403
    
    # Delete note
    response = client.delete("/notes/1")
    assert response.status_code == 403

def test_nonexistent_note_operations(client, auth_user):
    """Test operations on non-existent notes"""
    headers = auth_user["headers"]
    nonexistent_id = 99999
    
    # Get non-existent note
    response = client.get(f"/notes/{nonexistent_id}", headers=headers)
    assert response.status_code == 404
    
    # Update non-existent note
    update_data = {"title": "Test", "content": "Test", "version": 1}
    response = client.put(f"/notes/{nonexistent_id}", json=update_data, headers=headers)
    assert response.status_code == 404
    
    # Delete non-existent note
    response = client.delete(f"/notes/{nonexistent_id}", headers=headers)
    assert response.status_code == 404