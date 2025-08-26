import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User
from app.services.auth import hash_password

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
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

def test_register_user_success(client):
    """Test successful user registration"""
    user_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    response = client.post("/auth/register", json=user_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "User created successfully"
    assert "user_id" in data
    assert isinstance(data["user_id"], int)

def test_register_user_duplicate_username(client):
    """Test registration with duplicate username"""
    user_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    # Register first user
    response1 = client.post("/auth/register", json=user_data)
    assert response1.status_code == 201
    
    # Try to register with same username
    response2 = client.post("/auth/register", json=user_data)
    assert response2.status_code == 400
    assert "Username already exists" in response2.json()["detail"]

def test_register_user_invalid_data(client):
    """Test registration with invalid data"""
    # Test short username
    response = client.post("/auth/register", json={
        "username": "ab",  # Too short
        "password": "testpassword123"
    })
    assert response.status_code == 422
    
    # Test short password
    response = client.post("/auth/register", json={
        "username": "testuser",
        "password": "123"  # Too short
    })
    assert response.status_code == 422

def test_login_user_success(client, db_session):
    """Test successful user login"""
    # Create test user
    user = User(
        username="testuser",
        password_hash=hash_password("testpassword123")
    )
    db_session.add(user)
    db_session.commit()
    
    # Login
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    response = client.post("/auth/login", json=login_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 0

def test_login_user_wrong_password(client, db_session):
    """Test login with wrong password"""
    # Create test user
    user = User(
        username="testuser",
        password_hash=hash_password("testpassword123")
    )
    db_session.add(user)
    db_session.commit()
    
    # Login with wrong password
    login_data = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    
    response = client.post("/auth/login", json=login_data)
    
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    login_data = {
        "username": "nonexistent",
        "password": "testpassword123"
    }
    
    response = client.post("/auth/login", json=login_data)
    
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]