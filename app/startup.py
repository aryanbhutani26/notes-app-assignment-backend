import os
import logging
from app.database import engine, Base
from app.models import User, Note
from app.config import settings

logger = logging.getLogger(__name__)

def create_database_tables():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

def validate_environment():
    """Validate required environment variables and settings"""
    required_settings = {
        "SECRET_KEY": settings.SECRET_KEY,
        "DATABASE_URL": settings.DATABASE_URL,
    }
    
    missing_settings = []
    for setting_name, setting_value in required_settings.items():
        if not setting_value or setting_value == "your-secret-key-change-in-production":
            missing_settings.append(setting_name)
    
    if missing_settings:
        logger.warning(f"Using default values for: {', '.join(missing_settings)}")
        logger.warning("Please set proper values in production!")
    
    logger.info("Environment validation completed")

def startup_checks():
    """Perform startup checks and initialization"""
    logger.info("Starting Notes CRUD API...")
    
    # Validate environment
    validate_environment()
    
    # Create database tables
    create_database_tables()
    
    logger.info("Startup checks completed successfully")

if __name__ == "__main__":
    startup_checks()