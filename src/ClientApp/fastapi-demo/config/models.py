from typing import List, Optional
from pydantic import BaseModel


class SqlServerConfig(BaseModel):
    """SQL Server database config"""
    server: str = "127.0.0.1"
    port: int = 1433
    user_name: str = ""
    password: Optional[str] = None
    database: str = ""
    trusted_connection: Optional[bool] = None
    integrated_security: Optional[str] = None


class NPPAConfig(BaseModel):
    """NPPA config"""
    base_url: str = ""
    data_url: str = ""
    suffix: str = ""

class JwtConfig(BaseModel):
    """JWT config"""
    secret_key: str = ""
    access_token_expire_minutes: int = 60 * 24 * 8


class AppConfig(BaseModel):
    """App config"""
    sqlserver: SqlServerConfig = SqlServerConfig()

    jwt_config: JwtConfig = JwtConfig()

    pwd_salt: str = "salt"

    cors_origins: List[str] = []

    api_version: str = "v1"
    api_base_url: str = "/api"

    database: str = "sqlserver"

    host: str = "localhost"
    port: int = 8000

    nppa: NPPAConfig = NPPAConfig()
