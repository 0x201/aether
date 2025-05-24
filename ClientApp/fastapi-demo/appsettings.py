# coding=utf-8

import os
import secrets
from typing import Optional
import yaml

def load_config_file():
    current_path = os.path.abspath(__file__)
    current_dir = os.path.dirname(current_path)
    config_path = os.path.join(current_dir, "appsettings.yaml")

    with open(config_path, "r", encoding="u8") as file:
        return yaml.safe_load(file)


config = load_config_file()

class AppSettings:
    API_BASE_URL: str = f"{config['api_base_url']}/{config['api_version']}"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    MYSQL_CONNECTION_STRING: Optional[str] = (
        f"mysql+mysqlconnector://{config['mysql']['user_name']}:{config['mysql']['password']}@{config['mysql']['server']}:"
        f"{config['mysql']['port']}/{config['mysql']['database']}?charset=utf8"
    )
    SQLSERVER_CONNECTION_STRING: Optional[str] = (
        f"mssql+pymssql://{config['sqlserver']['server']}:{config['sqlserver']['port']}/{config['sqlserver']['database']}?charset=utf8;trusted_connection=yes"
    )
    # mssql+pymssql://sa:trickyrat@localhost:1433/fastapidemo?charset=utf8
    ORIGINS: list[str] = config["cors_origins"]
    DATABASE: Optional[str] = config["database"]
    NPPA_BASE_URL: Optional[str] = config["nppa"]["base_url"]
    NPPA_DATA_URL: Optional[str] = config["nppa"]["data_url"]
    NPPA_SUFFIX: Optional[str] = config["nppa"]["suffix"]
    HOST: Optional[str] = config["host"]
    PORT: Optional[int] = config["port"]
    PWDSalt: str = config["pwd_salt"]


appsettings = AppSettings()
