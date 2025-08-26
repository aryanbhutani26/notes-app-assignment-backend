from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.services.auth import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **username**: Must be 3-50 characters long and unique
    - **password**: Must be at least 6 characters long
    
    Returns the created user ID and success message.
    """
    try:
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # Create new user
        db_user = User(
            username=user_data.username,
            password_hash=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "message": "User created successfully",
            "user_id": db_user.id
        }
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT access token
    
    - **username**: Your registered username
    - **password**: Your password
    
    Returns a JWT token that expires in 30 minutes.
    Use this token in the Authorization header as "Bearer {token}" for protected endpoints.
    """
    # Get user from database
    user = db.query(User).filter(User.username == user_credentials.username).first()
    
    # Check if user exists and password is correct
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "username": user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }