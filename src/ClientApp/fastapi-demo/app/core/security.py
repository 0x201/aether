from typing import Union, Any
from datetime import datetime, timedelta

import bcrypt
import jwt

from config import config
ALGORITHM = "HS256"


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Generate jwt access token"""
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(
            minutes=config.jwt_config.expire_minutes
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, config.jwt_config.secret, algorithm=ALGORITHM)
    return encoded_jwt


def get_password_hash(password: str) -> (bytes, bytes):
    salt = bcrypt.gensalt(config.pwdsalt)
    password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return salt, password


def verify_password(plain_password: bytes, hashed_password: bytes) -> bool:
    return bcrypt.checkpw(plain_password, hashed_password)