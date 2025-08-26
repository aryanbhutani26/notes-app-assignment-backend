import uvicorn
from app.startup import startup_checks

if __name__ == "__main__":
    # Perform startup checks
    startup_checks()
    
    # Run the application
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )