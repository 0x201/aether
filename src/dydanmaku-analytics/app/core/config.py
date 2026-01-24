import argparse
import os
from pathlib import Path
from typing import List, Literal, Optional, Type


from pydantic import Field
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)
from .model import DatabaseConfig, SqliteConfig
from loguru import logger


def determine_environment(env: Optional[str | Path]) -> str:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--env", default=None, help="Environment to use (local, dev, uat, prod)"
    )
    args, _ = parser.parse_known_args()
    env_value = env or args.env or os.getenv("DYDANMU_ENV", "local")
    env_map = {
        "local": "local",
        "dev": "development",
        "uat": "uat",
        "prod": "production",
    }

    if isinstance(env_value, Path):
        env_value = str(env_value)

    current_env = env_map.get(env_value.lower(), "local")
    logger.info(f"Environment: {current_env}")
    return current_env


def get_project_root() -> Path:
    current_path = Path(__file__).resolve()
    while current_path != current_path.root:
        if (current_path / "main.py").exists() or (
            current_path / "app" / "core" / "config"
        ).is_dir():
            return current_path
        current_path = current_path.parent
    raise RuntimeError(
        "Project root directory not found. Ensure 'main.py' or 'config/' exists in the project root"
    )


def get_yaml_file() -> Path:
    current_env = determine_environment(None)
    return get_project_root() / "app" / "core" / f"{current_env}.yaml"


class LoggingConfig(BaseSettings):
    """Logging configuration"""

    level: str = Field(default="INFO", description="Log level")
    format: str = Field(
        default="[<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green>] [{level}] <level>{message}</level>",
        description="Log format",
    )
    rotation: str = Field(default="100 MB", description="Log rotation size")
    serialize: bool = Field(default=False, description="Serialize logs to JSON format")
    dir_path: str = Field(default="./logs", description="Log file storage path")
    enable_console: bool = Field(default=True, description="Enable console logging")
    enable_file: bool = Field(default=True, description="Enable file logging")


class NPPAConfig(BaseSettings):
    base_url: str = Field(default="", description="Base URL for NPPAs")
    data_url: str = Field(default="", description="Data URL for NPPAs")
    suffix: str = Field(default=".html", description="Suffix for NPPAs URLs")


class RabbitMQConfig(BaseSettings):
    """RabbitMQ configuration"""

    host: str = Field(default="localhost", description="RabbitMQ host")
    port: int = Field(default=5672, description="RabbitMQ port")
    username: str = Field(default="guest", description="RabbitMQ username")
    password: str = Field(default="guest", description="RabbitMQ password")



class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")
    project_name: str = Field(default="DyDanmaku API", description="Project name")
    host: str = Field(default="localhost", description="Host to run the server on")
    environment: Literal["local", "development", "uat", "production"] = Field(
        default="local", description="Environment to run the server in"
    )
    version: str = Field(default="0.0.1", description="Version of the server")
    port: int = Field(default=8000, description="Port to run the server on")
    databases: DatabaseConfig = Field(
        default=DatabaseConfig(
            active_database="sqlite",
            sqlserver=None,
            sqlite=SqliteConfig(sqlite_path="danmaku.db"),
            postgres=None,
        ),
        description="Database configuration",
    )
    cors: Optional[List[str]] = Field(default=[], description="CORS origins to allow")
    logging: LoggingConfig = Field(
        default=LoggingConfig(), description="Logging configuration"
    )
    nppa: NPPAConfig = Field(default=NPPAConfig(), description="NPPAs configuration")
    messaging: RabbitMQConfig = Field(
        default=RabbitMQConfig(), description="RabbitMQ configuration"
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: Type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        yam_file = get_yaml_file()
        return (
            env_settings,
            YamlConfigSettingsSource(settings_cls, yaml_file=yam_file),
            init_settings,
            dotenv_settings,
            file_secret_settings,
        )


# Create settings instance
settings = Settings()
