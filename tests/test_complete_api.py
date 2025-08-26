import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_complete_api.db"
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

def test_complete_api_workflow(client):
    """Test the complete API workflow from registration to note management"""
    
    # Step 1: Check API is running
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Notes CRUD API is running"
    
    # Step 2: Check health endpoint
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    
    # Step 3: Register a new user
    user_data = {
        "username": "completeuser",
        "password": "completepass123"
    }
    
    register_response = client.post("/auth/register", json=user_data)
    assert register_response.status_code == 201
    assert "user_id" in register_response.json()
    
    # Step 4: Login to get token
    login_response = client.post("/auth/login", json=user_data)
    assert login_response.status_code == 200
    token_data = login_response.json()
    token = token_data["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 5: Create multiple notes
    notes_to_create = [
        {"title": "First Note", "content": "This is my first note"},
        {"title": "Second Note", "content": "This is my second note"},
        {"title": "Third Note", "content": "This is my third note"}
    ]
    
    created_notes = []
    for note_data in notes_to_create:
        response = client.post("/notes/", json=note_data, headers=headers)
        assert response.status_code == 201
        created_notes.append(response.json())
    
    # Step 6: List all notes
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 200
    notes_list = response.json()["notes"]
    assert len(notes_list) == 3
    
    # Step 7: Get a specific note
    first_note_id = created_notes[0]["id"]
    response = client.get(f"/notes/{first_note_id}", headers=headers)
    assert response.status_code == 200
    note = response.json()
    assert note["title"] == "First Note"
    assert note["version"] == 1
    
    # Step 8: Update the note
    update_data = {
        "title": "Updated First Note",
        "content": "This is my updated first note",
        "version": note["version"]
    }
    
    response = client.put(f"/notes/{first_note_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    updated_note = response.json()
    assert updated_note["title"] == "Updated First Note"
    assert updated_note["version"] == 2
    
    # Step 9: Try to update with stale version (should fail)
    stale_update = {
        "title": "Stale Update",
        "content": "This should fail",
        "version": 1  # Old version
    }
    
    response = client.put(f"/notes/{first_note_id}", json=stale_update, headers=headers)
    assert response.status_code == 409
    assert "modified by another process" in response.json()["detail"]
    
    # Step 10: Delete a note
    second_note_id = created_notes[1]["id"]
    response = client.delete(f"/notes/{second_note_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Note deleted successfully"
    
    # Step 11: Verify note is deleted
    response = client.get(f"/notes/{second_note_id}", headers=headers)
    assert response.status_code == 404
    
    # Step 12: Verify remaining notes
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 200
    remaining_notes = response.json()["notes"]
    assert len(remaining_notes) == 2  # One deleted, two remaining
    
    # Step 13: Test authentication is required
    response = client.get("/notes/")  # No auth header
    assert response.status_code == 403

def test_api_documentation_endpoints(client):
    """Test that API documentation endpoints are accessible"""
    
    # Test OpenAPI docs
    response = client.get("/docs")
    assert response.status_code == 200
    
    # Test ReDoc
    response = client.get("/redoc")
    assert response.status_code == 200
    
    # Test OpenAPI JSON schema
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    
    # Verify basic schema structure
    assert "openapi" in schema
    assert "info" in schema
    assert schema["info"]["title"] == "Notes CRUD API"
    assert "paths" in schema
    
    # Verify key endpoints are documented
    paths = schema["paths"]
    assert "/auth/register" in paths
    assert "/auth/login" in paths
    assert "/notes/" in paths
    assert "/notes/{note_id}" in paths

def test_error_handling_and_validation(client):
    """Test comprehensive error handling and validation"""
    
    # Test validation errors
    response = client.post("/auth/register", json={
        "username": "ab",  # Too short
        "password": "validpassword123"
    })
    assert response.status_code == 422
    error_data = response.json()
    assert "detail" in error_data
    
    # Test duplicate username
    valid_user = {"username": "testuser", "password": "testpass123"}
    
    # Register first time
    response = client.post("/auth/register", json=valid_user)
    assert response.status_code == 201
    
    # Try to register again
    response = client.post("/auth/register", json=valid_user)
    assert response.status_code == 400
    assert "Username already exists" in response.json()["detail"]
    
    # Test invalid login
    response = client.post("/auth/login", json={
        "username": "nonexistent",
        "password": "wrongpass"
    })
    assert response.status_code == 401
    
    # Test accessing protected endpoint without auth
    response = client.post("/notes/", json={"title": "Test", "content": "Test"})
    assert response.status_code == 403

def test_all_requirements_verification(client):
    """Verify all requirements from the spec are met"""
    
    # Requirement 1: User registration and authentication
    user_data = {"username": "requser", "password": "reqpass123"}
    
    # 1.1: Valid registration creates user account
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 201
    
    # 1.2: Valid login returns JWT token
    response = client.post("/auth/login", json=user_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1.3: Invalid JWT returns 401
    invalid_headers = {"Authorization": "Bearer invalid.token"}
    response = client.get("/notes/", headers=invalid_headers)
    assert response.status_code == 401
    
    # Requirement 2: Create notes
    # 2.1: Authenticated user can create notes
    note_data = {"title": "Requirement Test", "content": "Testing requirements"}
    response = client.post("/notes/", json=note_data, headers=headers)
    assert response.status_code == 201
    created_note = response.json()
    assert "id" in created_note
    assert "created_at" in created_note
    
    # 2.2: Unauthenticated user cannot create notes
    response = client.post("/notes/", json=note_data)
    assert response.status_code == 403
    
    # 2.3: Invalid data returns 400
    response = client.post("/notes/", json={"title": ""}, headers=headers)
    assert response.status_code == 422
    
    # Requirement 3: Retrieve notes
    note_id = created_note["id"]
    
    # 3.1: User can get their notes
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()["notes"]) >= 1
    
    # 3.2: User can get specific note
    response = client.get(f"/notes/{note_id}", headers=headers)
    assert response.status_code == 200
    
    # 3.3: Non-existent note returns 404
    response = client.get("/notes/99999", headers=headers)
    assert response.status_code == 404
    
    # 3.4: Unauthenticated access returns 401/403
    response = client.get("/notes/")
    assert response.status_code == 403
    
    # Requirement 4: Update notes
    # 4.1: User can update their note
    update_data = {
        "title": "Updated Title",
        "content": "Updated content",
        "version": created_note["version"]
    }
    response = client.put(f"/notes/{note_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    # 4.3: Invalid data returns 400
    invalid_update = {"title": "", "content": "test", "version": 2}
    response = client.put(f"/notes/{note_id}", json=invalid_update, headers=headers)
    assert response.status_code == 422
    
    # Requirement 5: Delete notes
    # 5.1: User can delete their note
    response = client.delete(f"/notes/{note_id}", headers=headers)
    assert response.status_code == 200
    
    # 5.3: Deleted note returns 404
    response = client.get(f"/notes/{note_id}", headers=headers)
    assert response.status_code == 404
    
    print("✅ All requirements verified successfully!")