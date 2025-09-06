from typing import List, Optional
from pydantic import BaseModel


class DatabaseConfig(BaseModel):
    server: str
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    database: Optional[str] = None
    trusted_connection: bool = False
    authentication: Optional[str] = None


class JwtConfig(BaseModel):
    secret: str = "secret"
    expire_minutes: int = 120


class CorsConfig(BaseModel):
    cors_allow_origins: List[str] = []
    cors_allow_methods: List[str] = []


class ApiConfig(BaseModel):
    api_version: str = "v1"
    api_prefix: str = ""
    port: int = 8000
    host: str = "localhost"


class NPPAConfig(BaseModel):
    base_url: str
    data_url: str
    suffix: str
