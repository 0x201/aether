"""
Dependencies for the API.
These dependencies are used to inject database sessions and user authentication into endpoints.
"""

from typing import Generator

from config import config
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from src.db.session_connector import SessionConnector


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a SQLAlchemy database session.
    """
    session_connector = SessionConnector()
    with session_connector.get_session() as db:
        yield db


def get_current_user(request: Request):
    """
    Dependency that provides the current user from the Keycloak token.
    Returns a dictionary with detailed user information including roles.
    """
    # Try to get current_user from scope (set by middleware)
    if hasattr(request, 'scope') and isinstance(request.scope, dict):
        user_info = request.scope.get('current_user')
        if user_info:
            return user_info
    
    # If no user info is available, raise an authentication error
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
