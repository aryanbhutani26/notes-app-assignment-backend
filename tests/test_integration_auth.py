import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User
from app.services.auth import hash_password, create_access_token
from datetime import datetime, timedelta

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration_auth.db"
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

def test_complete_registration_and_login_flow(client):
    """Test complete user registration and login workflow"""
    # Step 1: Register a new user
    registration_data = {
        "username": "integrationuser",
        "password": "integrationpass123"
    }
    
    register_response = client.post("/auth/register", json=registration_data)
    assert register_response.status_code == 201
    register_data = register_response.json()
    assert register_data["message"] == "User created successfully"
    assert "user_id" in register_data
    
    # Step 2: Login with the registered user
    login_data = {
        "username": "integrationuser",
        "password": "integrationpass123"
    }
    
    login_response = client.post("/auth/login", json=login_data)
    assert login_response.status_code == 200
    login_response_data = login_response.json()
    assert "access_token" in login_response_data
    assert login_response_data["token_type"] == "bearer"
    
    # Step 3: Use the token to access a protected endpoint
    token = login_response_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to access notes endpoint (should work)
    notes_response = client.get("/notes/", headers=headers)
    assert notes_response.status_code == 200
    notes_data = notes_response.json()
    assert "notes" in notes_data
    assert notes_data["notes"] == []  # No notes yet

def test_token_validation_scenarios(client, db_session):
    """Test various token validation scenarios"""
    # Create a test user
    user = User(
        username="tokenuser",
        password_hash=hash_password("tokenpass123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Test 1: Valid token
    valid_token = create_access_token({"user_id": user.id, "username": user.username})
    headers = {"Authorization": f"Bearer {valid_token}"}
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 200
    
    # Test 2: Invalid token
    invalid_headers = {"Authorization": "Bearer invalid.token.here"}
    response = client.get("/notes/", headers=invalid_headers)
    assert response.status_code == 401
    
    # Test 3: Missing token
    response = client.get("/notes/")
    assert response.status_code == 403  # FastAPI returns 403 for missing auth
    
    # Test 4: Malformed authorization header
    malformed_headers = {"Authorization": "InvalidFormat token"}
    response = client.get("/notes/", headers=malformed_headers)
    assert response.status_code == 403

def test_token_expiration_handling(client, db_session):
    """Test handling of expired tokens"""
    # Create a test user
    user = User(
        username="expireduser",
        password_hash=hash_password("expiredpass123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create an expired token (negative expiration)
    expired_token = create_access_token(
        {"user_id": user.id, "username": user.username},
        expires_delta=timedelta(seconds=-1)
    )
    
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/notes/", headers=headers)
    assert response.status_code == 401

def test_authentication_failure_cases(client):
    """Test various authentication failure scenarios"""
    # Test 1: Login with non-existent user
    response = client.post("/auth/login", json={
        "username": "nonexistent",
        "password": "password123"
    })
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]
    
    # Test 2: Registration with invalid data
    response = client.post("/auth/register", json={
        "username": "ab",  # Too short
        "password": "validpassword123"
    })
    assert response.status_code == 422
    
    # Test 3: Registration with short password
    response = client.post("/auth/register", json={
        "username": "validuser",
        "password": "123"  # Too short
    })
    assert response.status_code == 422

def test_user_isolation_through_tokens(client, db_session):
    """Test that users can only access their own data through tokens"""
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
    
    # User1 creates a note
    headers1 = {"Authorization": f"Bearer {token1}"}
    note_data = {"title": "User1 Note", "content": "This is user1's note"}
    response = client.post("/notes/", json=note_data, headers=headers1)
    assert response.status_code == 201
    note_id = response.json()["id"]
    
    # User2 tries to access User1's note (should fail)
    headers2 = {"Authorization": f"Bearer {token2}"}
    response = client.get(f"/notes/{note_id}", headers=headers2)
    assert response.status_code == 404  # Not found (due to user isolation)
    
    # User1 can access their own note
    response = client.get(f"/notes/{note_id}", headers=headers1)
    assert response.status_code == 200
    assert response.json()["title"] == "User1 Note"