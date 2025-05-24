from typing import Union, Any
from datetime import datetime, timedelta

import bcrypt
import jwt

from appsettings import appsettings
ALGORITHM = "HS256"


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Generate jwt access token"""
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(
            minutes=appsettings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, appsettings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_password_hash(password: str) -> (bytes, bytes):
    salt = bcrypt.gensalt(appsettings.PWDSalt)
    password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return salt, password


def verify_password(plain_password: bytes, hashed_password: bytes) -> bool:
    return bcrypt.checkpw(plain_password, hashed_password)
