import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

import jwt
import emails
from emails.template import JinjaTemplate

from appsettings import appsettings


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    assert appsettings.EMAILS_ENABLED, "no provided configuration for email variables"
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(appsettings.EMAILS_FROM_NAME, appsettings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": appsettings.SMTP_HOST, "port": appsettings.SMTP_PORT}
    if appsettings.SMTP_TLS:
        smtp_options["tls"] = True
    if appsettings.SMTP_USER:
        smtp_options["user"] = appsettings.SMTP_USER
    if appsettings.SMTP_PASSWORD:
        smtp_options["password"] = appsettings.SMTP_PASSWORD
    response = message.send(to=email_to, render=environment, smtp=smtp_options)
    logging.info(f"send email result: {response}")


def send_test_email(email_to: str) -> None:
    project_name = appsettings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    with open(Path(appsettings.EMAIL_TEMPLATES_DIR) / "test_email.html") as f:
        template_str = f.read()
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={"project_name": appsettings.PROJECT_NAME, "email": email_to},
    )


def send_reset_password_email(email_to: str, email: str, token: str) -> None:
    project_name = appsettings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    with open(Path(appsettings.EMAIL_TEMPLATES_DIR) / "reset_password.html") as f:
        template_str = f.read()
    server_host = appsettings.SERVER_HOST
    link = f"{server_host}/reset-password?token={token}"
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": appsettings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": appsettings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )


def send_new_account_email(email_to: str, username: str, password: str) -> None:
    project_name = appsettings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    with open(Path(appsettings.EMAIL_TEMPLATES_DIR) / "new_account.html") as f:
        template_str = f.read()
    link = appsettings.SERVER_HOST
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": appsettings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": link,
        },
    )


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=appsettings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
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
