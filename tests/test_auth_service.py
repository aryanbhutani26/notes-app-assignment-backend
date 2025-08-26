import pytest
from datetime import timedelta
from app.services.auth import hash_password, verify_password, create_access_token, verify_token

def test_password_hashing():
    """Test password hashing and verification"""
    password = "testpassword123"
    hashed = hash_password(password)
    
    # Hash should be different from original password
    assert hashed != password
    assert len(hashed) > 0
    
    # Verification should work
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_password_hash_uniqueness():
    """Test that same password produces different hashes"""
    password = "testpassword123"
    hash1 = hash_password(password)
    hash2 = hash_password(password)
    
    # Hashes should be different due to salt
    assert hash1 != hash2
    
    # But both should verify correctly
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True

def test_jwt_token_creation_and_verification():
    """Test JWT token creation and verification"""
    data = {"user_id": 1, "username": "testuser"}
    token = create_access_token(data)
    
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Verify token
    payload = verify_token(token)
    assert payload is not None
    assert payload["user_id"] == 1
    assert payload["username"] == "testuser"
    assert "exp" in payload

def test_jwt_token_with_custom_expiry():
    """Test JWT token with custom expiration"""
    data = {"user_id": 1, "username": "testuser"}
    expires_delta = timedelta(minutes=5)
    token = create_access_token(data, expires_delta)
    
    payload = verify_token(token)
    assert payload is not None
    assert payload["user_id"] == 1

def test_invalid_jwt_token():
    """Test verification of invalid JWT token"""
    invalid_token = "invalid.jwt.token"
    payload = verify_token(invalid_token)
    assert payload is None

def test_empty_jwt_token():
    """Test verification of empty JWT token"""
    payload = verify_token("")
    assert payload is None