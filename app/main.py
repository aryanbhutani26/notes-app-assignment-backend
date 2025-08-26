from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.database import engine, Base
from app.models import User, Note  # Import models to register them
from app.routers import auth, notes
from app.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app.middleware import add_cors_middleware, add_trusted_host_middleware, log_requests_middleware
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Notes CRUD API",
    description="""
    A minimal CRUD API for notes with JWT authentication.
    
    ## Features
    
    * **User Authentication**: Register and login with JWT tokens
    * **Notes Management**: Create, read, update, and delete personal notes
    * **User Isolation**: Users can only access their own notes
    * **Race Condition Protection**: Optimistic locking prevents concurrent update conflicts
    * **Comprehensive Validation**: Input validation with detailed error messages
    
    ## Authentication
    
    1. Register a new account at `/auth/register`
    2. Login at `/auth/login` to get your JWT token
    3. Include the token in the Authorization header: `Bearer {your_token}`
    4. Tokens expire after 30 minutes
    
    ## Race Condition Handling
    
    When updating notes, include the current `version` number in your request.
    If another process has modified the note, you'll receive a 409 Conflict error.
    Refresh the note data and try again with the new version number.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Notes API Support",
        "email": "support@notesapi.com",
    },
    license_info={
        "name": "MIT",
    },
)

# Add middleware
add_cors_middleware(app)
add_trusted_host_middleware(app)
app.middleware("http")(log_requests_middleware)

# Add exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])

@app.get("/")
async def root():
    return {"message": "Notes CRUD API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}