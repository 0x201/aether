# Crawler API

A Python-based web API for crawling and managing data, built with FastAPI. This API provides endpoints for managing authors, books, users, and NPPA (National Press and Publication Administration) game audits, with database integration and security features.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Development](#development)
  - [Testing](#testing)
  - [Database Migrations](#database-migrations)
- [Deployment](#deployment)
- [License](#license)

## Overview

The Crawler API is a FastAPI-based web service that provides RESTful APIs for data crawling and management operations. It includes functionality for managing authors, books, users, and NPPA game audits with a complete authentication system.

## Features

- RESTful API design with FastAPI
- SQLAlchemy ORM for database operations
- Alembic for database migrations
- JWT-based authentication and authorization
- Pydantic models for data validation
- Beautiful Soup for web crawling
- Playwright for advanced web scraping
- CORS support
- Unit testing with pytest
- Code coverage reporting
- Asynchronous task processing with Celery

## Technology Stack

- [Python 3.13+](https://www.python.org/) - Programming language
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM
- [Alembic](https://alembic.sqlalchemy.org/) - Database migration tool
- [Pydantic](https://pydantic-docs.helpmanual.io/) - Data validation
- [JWT](https://jwt.io/) - Token-based authentication
- [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/) - Web scraping
- [Playwright](https://playwright.dev/python/) - Browser automation
- [Pytest](https://pytest.org/) - Testing framework
- [Coverage.py](https://coverage.readthedocs.io/) - Code coverage tool
- [Uvicorn](https://www.uvicorn.org/) - ASGI server

## Project Structure

```
src/
├── api/                    # API endpoints
│   ├── api_v1/            # API v1 routes
│   │   ├── endpoints/     # Individual endpoint modules
│   │   └── api.py         # API router
│   └── deps.py            # Dependency injection
├── core/                  # Core application components
├── crud/                  # CRUD operations
├── db/                    # Database configuration
├── models/                # Database models
├── schemas/               # Pydantic schemas
├── nppa_game_audit_crawler.py  # NPPA game audit crawler
└── utils.py               # Utility functions

alembic/                   # Database migrations
config/                    # Configuration files
test/                      # Test files
```

## Getting Started

### Prerequisites

- Python 3.13+
- pip or uv (package manager)
- Database (PostgreSQL, MySQL, or SQLite)

### Installation

```bash
# Navigate to the crawler-api directory
cd src/crawler-api

# Install dependencies using uv (recommended)
uv sync

# Or install dependencies using pip
pip install -e .
```

### Database Setup

```bash
# Initialize the database
alembic upgrade head
```

### Running the Application

```bash
# Development server
uvicorn main:app --reload

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/v1/login/access-token` - Get access token

### Authors
- `GET /api/v1/authors/` - Get list of authors
- `POST /api/v1/authors/` - Create a new author
- `GET /api/v1/authors/{id}` - Get an author by ID
- `PUT /api/v1/authors/{id}` - Update an author
- `DELETE /api/v1/authors/{id}` - Delete an author

### Books
- `GET /api/v1/books/` - Get list of books
- `POST /api/v1/books/` - Create a new book
- `GET /api/v1/books/{id}` - Get a book by ID
- `PUT /api/v1/books/{id}` - Update a book
- `DELETE /api/v1/books/{id}` - Delete a book

### Users
- `GET /api/v1/users/` - Get list of users (admin only)
- `POST /api/v1/users/` - Create a new user
- `GET /api/v1/users/{id}` - Get a user by ID
- `PUT /api/v1/users/{id}` - Update a user
- `DELETE /api/v1/users/{id}` - Delete a user

### NPPA Game Audits
- `GET /api/v1/nppa-game-audits/` - Get list of NPPA game audits
- `POST /api/v1/nppa-game-audits/sync` - Sync NPPA game audits

### Utilities
- `GET /api/v1/utils/database-info` - Get database information

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Obtain a token by authenticating at `POST /api/v1/login/access-token`
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your-token>
   ```

## Development

### Testing

```bash
# Run tests
pytest

# Run tests with coverage
coverage run -m pytest

# Generate coverage report
coverage report
coverage html
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Migration message"

# Apply migrations
alembic upgrade head

# Downgrade migrations
alembic downgrade -1
```

## Deployment

### Production Deployment

```bash
# Using uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Using Gunicorn (requires installing gunicorn)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## License

This project is licensed under the MIT License.