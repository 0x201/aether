import argparse
import os
from pathlib import Path
from typing import Literal

from loguru import logger
from pydantic import BaseModel, Field
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

from .model import DatabaseConfig


def determine_environment(env: str | Path | None = None) -> str:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--env", default=None, help="Environment to use (local, dev, uat)"
    )
    args, _ = parser.parse_known_args()
    env_value = env or args.env or os.getenv("DYDANMU_ENV", "local")
    env_map = {
        "local": "local",
        "dev": "development",
        "development": "development",
        "uat": "uat",
    }

    if isinstance(env_value, Path):
        env_value = str(env_value)

    current_env = env_map.get(str(env_value).lower(), "local")
    logger.info(f"Environment: {current_env}")
    return current_env


def get_config_dir() -> Path:
    """配置 YAML 所在目录（`src/core/`）。"""
    return Path(__file__).resolve().parent


def get_yaml_file(env: str | Path | None = None) -> Path:
    return get_config_dir() / f"{determine_environment(env)}.yaml"


class LoggingConfig(BaseModel):
    """Logging configuration"""

    level: str = Field(default="INFO", description="Log level")
    format: str = Field(
        default=(
            "[<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green>] "
            "[{level}] <level>{message}</level>"
        ),
        description="Log format",
    )
    rotation: str = Field(default="100 MB", description="Log rotation size")
    serialize: bool = Field(default=False, description="Serialize logs to JSON format")
    dir_path: str = Field(default="./logs", description="Log file storage path")
    enable_console: bool = Field(default=True, description="Enable console logging")
    enable_file: bool = Field(default=True, description="Enable file logging")


class RabbitMQConfig(BaseModel):
    rabbitmq_host: str = Field(
        default=os.getenv("EVENTBUS_HOST", "localhost"), description="RabbitMQ host"
    )
    rabbitmq_port: int = Field(
        default=int(os.getenv("EVENTBUS_PORT", "5672")), description="RabbitMQ port"
    )
    rabbitmq_username: str = Field(
        default=os.getenv("EVENTBUS_USERNAME", "guest"), description="RabbitMQ username"
    )
    rabbitmq_password: str = Field(
        default=os.getenv("EVENTBUS_PASSWORD", "guest"), description="RabbitMQ password"
    )
    virtual_host: str = Field(default="/", description="RabbitMQ virtual host")
    exchange: str = Field(default="mc_event_bus", description="RabbitMQ exchange")
    queue: str = Field(default="Danmaku", description="RabbitMQ queue")


class RedisConfig(BaseModel):
    redis_host: str = Field(
        default=os.getenv("REDIS_HOST", "localhost"), description="Redis host"
    )
    redis_port: int = Field(
        default=int(os.getenv("REDIS_PORT", "6379")), description="Redis port"
    )
    redis_password: str | None = Field(
        default=os.getenv("REDIS_PASSWORD", None), description="Redis password"
    )
    ssl: bool = Field(default=False, description="Use SSL for Redis")
    ssl_ca_certs: str = Field(
        default=os.getenv("SSL_CERT_FILE", ""),
        description="Path to SSL CA certificates",
    )
    socket_connect_timeout: float = Field(
        default=float(os.getenv("REDIS_CONNECT_TIMEOUT", "3")),
        gt=0,
        description="Redis connect timeout in seconds",
    )
    socket_timeout: float = Field(
        default=float(os.getenv("REDIS_SOCKET_TIMEOUT", "3")),
        gt=0,
        description="Redis socket read/write timeout in seconds",
    )
    operation_timeout: float = Field(
        default=float(os.getenv("REDIS_OPERATION_TIMEOUT", "3")),
        gt=0,
        description=(
            "Hard timeout for a single cache operation in seconds; "
            "guards against clients that ignore socket timeouts"
        ),
    )


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")
    project_name: str = Field(
        default="Aether Social Analytics Hub API", description="Project name"
    )
    host: str = Field(default="localhost", description="Host to run the server on")
    environment: Literal["local", "development", "uat"] = Field(
        default="local", description="Environment to run the server in"
    )
    version: str = Field(default="0.0.1", description="Version of the server")
    port: int = Field(
        default=int(os.getenv("PORT", "8000")), description="Port to run the server on"
    )
    databases: DatabaseConfig = Field(
        default_factory=DatabaseConfig, description="Database configuration"
    )
    cors: list[str] | None = Field(default=[], description="CORS origins to allow")
    logging: LoggingConfig = Field(
        default=LoggingConfig(), description="Logging configuration"
    )
    messaging: RabbitMQConfig = Field(
        default=RabbitMQConfig(), description="RabbitMQ configuration"
    )
    cache: RedisConfig = Field(default=RedisConfig(), description="Redis configuration")
    otel_exporter_otlp_endpoint: str = Field(
        default=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", ""),
        description="OTLP endpoint for OpenTelemetry",
    )
    otel_service_name: str = Field(
        default=os.getenv("OTEL_SERVICE_NAME", "dydanmakuanalytics"),
        description="Service name for OpenTelemetry",
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
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
