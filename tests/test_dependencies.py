import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User
from app.dependencies import get_current_user
from app.services.auth import create_access_token, hash_password

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_deps.db"
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

@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        username="testuser",
        password_hash=hash_password("testpassword")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.mark.asyncio
async def test_get_current_user_valid_token(db_session, test_user):
    """Test getting current user with valid token"""
    # Create valid token
    token_data = {"user_id": test_user.id, "username": test_user.username}
    token = create_access_token(token_data)
    
    # Create credentials
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    # Get current user
    current_user = await get_current_user(credentials, db_session)
    
    assert current_user.id == test_user.id
    assert current_user.username == test_user.username

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session):
    """Test getting current user with invalid token"""
    # Create invalid credentials
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token")
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials, db_session)
    
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail

@pytest.mark.asyncio
async def test_get_current_user_nonexistent_user(db_session):
    """Test getting current user with token for non-existent user"""
    # Create token for non-existent user
    token_data = {"user_id": 999, "username": "nonexistent"}
    token = create_access_token(token_data)
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials, db_session)
    
    assert exc_info.value.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user_token_without_user_id(db_session):
    """Test getting current user with token missing user_id"""
    # Create token without user_id
    token_data = {"username": "testuser"}
    token = create_access_token(token_data)
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials, db_session)
    
    assert exc_info.value.status_code == 401