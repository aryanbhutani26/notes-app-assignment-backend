from sqlalchemy import create_engine
from app.database import Base
from app.models import User, Note  # Import models to register them
from app.config import settings

def create_tables():
    """Create all database tables"""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def drop_tables():
    """Drop all database tables (use with caution!)"""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.drop_all(bind=engine)
    print("Database tables dropped!")

if __name__ == "__main__":
    create_tables()