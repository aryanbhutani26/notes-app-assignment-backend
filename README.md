# Notes CRUD API

A minimal CRUD API for notes with JWT authentication built with FastAPI.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **CRUD Operations**: Complete Create, Read, Update, Delete operations for notes
- **User Isolation**: Users can only access their own notes
- **Race Condition Protection**: Optimistic locking prevents concurrent update conflicts
- **Comprehensive Error Handling**: Detailed error messages and proper HTTP status codes
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Input Validation**: Robust request validation with Pydantic
- **Security**: Password hashing with bcrypt, JWT token expiration

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings (optional for development)
```

### 3. Run the Application
```bash
python run.py
```

### 4. Access the API
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Usage

### Authentication Flow

1. **Register a new user**:
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "myuser", "password": "mypassword123"}'
```

2. **Login to get JWT token**:
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "myuser", "password": "mypassword123"}'
```

3. **Use the token for protected endpoints**:
```bash
curl -X GET "http://localhost:8000/notes/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Notes Management

**Create a note**:
```bash
curl -X POST "http://localhost:8000/notes/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Note", "content": "Note content here"}'
```

**Update a note** (with version for race condition protection):
```bash
curl -X PUT "http://localhost:8000/notes/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Note", "content": "Updated content", "version": 1}'
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |

### Notes (Requires Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes/` | Get all user's notes |
| GET | `/notes/{note_id}` | Get a specific note |
| POST | `/notes/` | Create a new note |
| PUT | `/notes/{note_id}` | Update a note (with optimistic locking) |
| DELETE | `/notes/{note_id}` | Delete a note |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check |
| GET | `/docs` | Interactive API documentation |

## Race Condition Handling

This API implements optimistic locking to prevent race conditions during concurrent updates:

1. Each note has a `version` field that increments on every update
2. When updating a note, include the current `version` in your request
3. If another process has modified the note, you'll receive a `409 Conflict` error
4. Refresh the note data and retry with the new version number

Example:
```json
{
  "title": "Updated Title",
  "content": "Updated content", 
  "version": 2
}
```

## Testing

Run the complete test suite:
```bash
pytest
```

Run specific test categories:
```bash
# Test authentication
pytest tests/test_auth_service.py tests/test_integration_auth.py

# Test notes functionality  
pytest tests/test_integration_notes.py

# Test complete API workflow
pytest tests/test_complete_api.py
```

## Docker Deployment

Build and run with Docker:
```bash
docker build -t notes-api .
docker run -p 8000:8000 notes-api
```

Or use Docker Compose:
```bash
docker-compose up
```

## Configuration

Environment variables (optional):
- `SECRET_KEY`: JWT signing secret (change in production!)
- `DATABASE_URL`: Database connection string (default: SQLite)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

## Architecture

- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Default database (easily replaceable)
- **JWT**: Stateless authentication
- **Pydantic**: Data validation and serialization
- **Pytest**: Comprehensive testing framework

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Input validation and sanitization
- SQL injection prevention via ORM
- CORS protection
- Request logging and monitoring