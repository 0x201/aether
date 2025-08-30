from datetime import datetime, timedelta
from typing import Optional

import jwt

from config import config

def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=config.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        config.jwt_config.secret,
        algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    try:
        decoded_token = jwt.decode(token, config.jwt_config.secret, algorithms=["HS256"])
        return decoded_token["email"]
    except jwt.PyJWTError:
        return None


def get_current_timestamp(output_format: str = "%Y%m%d%H%M%S") -> str:
    return datetime.now().strftime(output_format)