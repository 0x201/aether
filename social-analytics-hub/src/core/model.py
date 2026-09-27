from enum import StrEnum
from os import getenv

from pydantic import BaseModel, ConfigDict, Field


class DatabaseType(StrEnum):
    SQLSERVER = "sqlserver"
    SQLITE = "sqlite"
    POSTGRESQL = "postgres"


class PostgreSQLConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    host: str = Field(
        getenv("DYDANMAKUDB_HOST", "localhost"), description="Database host address"
    )
    port: int | None = Field(
        int(getenv("DYDANMAKUDB_PORT", "5432")), description="Database server port"
    )
    username: str | None = Field(
        getenv("DYDANMAKUDB_USERNAME", "postgres"), description="Database username"
    )
    password: str | None = Field(
        getenv("DYDANMAKUDB_PASSWORD", ""), description="Database password"
    )
    database: str = Field(
        getenv("DYDANMAKUDB_DATABASENAME", "dydanmakudb"), description="Database name"
    )
    dbschema: str | None = Field(None, description="Database schema")

    echo: bool = Field(False)
    pool_size: int = Field(10)
    max_overflow: int = Field(20)
    pool_timeout: int = Field(30)
    pool_recycle: int = Field(3600)
    pool_pre_ping: bool = Field(True)


class DatabaseConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    db_type: DatabaseType = Field(DatabaseType.POSTGRESQL, description="Database type")
    postgres: PostgreSQLConfig = Field(
        default_factory=PostgreSQLConfig, description="PostgreSQL config"
    )
