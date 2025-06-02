import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

import jwt

from appsettings import appsettings


# def send_email(
#     email_to: str,
#     subject_template: str = "",
#     html_template: str = "",
#     environment: Dict[str, Any] = {},
# ) -> None:
#     assert appsettings.EMAILS_ENABLED, "no provided configuration for email variables"
#     message = emails.Message(
#         subject=JinjaTemplate(subject_template),
#         html=JinjaTemplate(html_template),
#         mail_from=(appsettings.EMAILS_FROM_NAME, appsettings.EMAILS_FROM_EMAIL),
#     )
#     smtp_options = {"host": appsettings.SMTP_HOST, "port": appsettings.SMTP_PORT}
#     if appsettings.SMTP_TLS:
#         smtp_options["tls"] = True
#     if appsettings.SMTP_USER:
#         smtp_options["user"] = appsettings.SMTP_USER
#     if appsettings.SMTP_PASSWORD:
#         smtp_options["password"] = appsettings.SMTP_PASSWORD
#     response = message.send(to=email_to, render=environment, smtp=smtp_options)
#     logging.info(f"send email result: {response}")


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=appsettings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        appsettings.SECRET_KEY,
        algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    try:
        decoded_token = jwt.decode(token, appsettings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["email"]
    except jwt.JWTError:
        return None
