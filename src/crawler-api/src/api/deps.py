"""
Dependencies for the API.
These dependencies are used to inject database sessions and user authentication into endpoints.
"""

from typing import Generator

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from pydantic import ValidationError
from sqlalchemy.orm import Session, joinedload

from src import crud, models, schemas
from src.core import security
from config import config
from src.db.session_connector import SessionConnector


def get_oauth2() -> OAuth2PasswordBearer:
    """
    Dependency that provides an OAuth2 password bearer.
    """
    return OAuth2PasswordBearer(
        tokenUrl=f"{config.api_config.api_prefix}/{config.api_config.api_version}/login/access-token"
    )

def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a SQLAlchemy database session.
    """
    session_connector = SessionConnector()
    with session_connector.get_session() as db:
        yield db


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(get_oauth2)
) -> models.User:
    """
    Dependency that verifies and returns the current authenticated user.
    """
    try:
        payload = jwt.decode(
            token, config.jwt_config.secret, algorithms=[security.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = crud.user.get(db, id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Dependency that verifies and returns the current authenticated user if active.
    """
    if not crud.user.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Dependency that verifies and returns the current authenticated user if superuser.
    """
    if not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user