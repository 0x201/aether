from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DatabaseType(str, Enum):
    SQLSERVER = "sqlserver"
    SQLITE = "sqlite"
    POSTGRESQL = "postgres"


class SqlServerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    server: str = Field(..., description="Database server address")
    port: Optional[int] = Field(1433, description="Database server port")
    username: Optional[str] = Field(None, description="Database username")
    password: Optional[str] = Field(None, description="Database password")
    database: str = Field(..., description="Database name")
    trusted_connection: bool = Field(
        False, description="Use trusted connection for SQL Server"
    )
    authentication: Optional[str] = Field(
        None, description="Authentication method for SQL Server"
    )

    @field_validator("server")
    @classmethod
    def server_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate server if we're using SQL Server
        if info.data.get("type") == DatabaseType.SQLSERVER:
            if not v or not v.strip():
                raise ValueError("Server must not be empty for SQL Server")
        return v

    @field_validator("port")
    @classmethod
    def port_must_be_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 65535):
            raise ValueError("Port must be between 1 and 65535")
        return v

    @field_validator("database")
    @classmethod
    def database_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate database if we're using SQL Server
        if info.data.get("type") == DatabaseType.SQLSERVER:
            if v is not None and not v.strip():
                raise ValueError("Database must not be empty for SQL Server")
        return v

    @field_validator("username")
    @classmethod
    def username_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate username if we're using SQL Server
        if info.data.get("type") == DatabaseType.SQLSERVER:
            if v is not None and not v.strip():
                raise ValueError("Username must not be empty for SQL Server")
        return v


class SqliteConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sqlite_path: str = Field("danmaku.db", description="Path to SQLite database file")

    @field_validator("sqlite_path")
    @classmethod
    def sqlite_path_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate sqlite_path if we're using SQLite
        if info.data.get("type") == DatabaseType.SQLITE:
            if not v or not v.strip():
                raise ValueError("SQLite path must not be empty for SQLite")
        return v


class PostgreSQLConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    host: str = Field(..., description="Database host address")
    port: Optional[int] = Field(1433, description="Database server port")
    username: Optional[str] = Field(None, description="Database username")
    password: Optional[str] = Field(None, description="Database password")
    database: str = Field(..., description="Database name")

    @field_validator("host")
    @classmethod
    def host_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate server if we're using PostgreSQL
        if info.data.get("type") == DatabaseType.POSTGRESQL:
            if not v or not v.strip():
                raise ValueError("Server must not be empty for PostgreSQL")
        return v

    @field_validator("port")
    @classmethod
    def port_must_be_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 65535):
            raise ValueError("Port must be between 1 and 65535")
        return v

    @field_validator("database")
    @classmethod
    def database_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate database if we're using PostgreSQL
        if info.data.get("type") == DatabaseType.POSTGRESQL:
            if v is not None and not v.strip():
                raise ValueError("Database must not be empty for PostgreSQL")
        return v

    @field_validator("username")
    @classmethod
    def username_must_not_be_empty(cls, v: Optional[str], info) -> Optional[str]:
        # Only validate username if we're using PostgreSQL
        if info.data.get("type") == DatabaseType.POSTGRESQL:
            if v is not None and not v.strip():
                raise ValueError("Username must not be empty for PostgreSQL")
        return v


class DatabaseConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    active_database: Optional[str] = Field("sqlite", description="Active database name")
    sqlserver: Optional[SqlServerConfig] = Field(None, description="SQL Server config")
    sqlite: SqliteConfig = Field(..., description="SQLite config")
    postgres: Optional[PostgreSQLConfig] = Field(None, description="PostgreSQL config")
