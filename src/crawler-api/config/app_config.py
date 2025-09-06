import argparse
import os
from pathlib import Path
from typing import Optional, Any

from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.logger import logger
from yaml import safe_load

from .model import (
    ApiConfig,
    CorsConfig,
    DatabaseConfig,
    JwtConfig,
    NPPAConfig,
)


def determine_environment(env: Optional[str | Path]) -> str:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--env", default=None, help="Environment to use (local, dev, uat, prod)"
    )
    args, _ = parser.parse_known_args()
    env_value = env or args.env or os.getenv("FASTAPI_ENV", "local")
    env_map = {
        "local": "local",
        "dev": "development",
        "uat": "uat",
        "prod": "production",
    }

    return env_map.get(env_value.lower(), "local")


def get_project_root() -> Path:
    current_path = Path(__file__).resolve()
    while current_path != current_path.root:
        if (current_path / "main.py").exists() or (current_path / "config").is_dir():
            return current_path
        current_path = current_path.parent
    raise RuntimeError(
        "Project root directory not found. Ensure 'main.py' or 'config/' exists in the project root"
    )


class AppConfig(BaseModel):
    def __init__(
        self,
        /,
        config_file: Optional[str | Path] = None,
        env: Optional[str | Path] = None,
        **data: Any,
    ):
        super().__init__(**data)
        self.__config_dic: Any
        self.__project_root = get_project_root()
        self.__env_name: str = determine_environment(env)
        self.__load_env_file()
        self.__load_config(config_file)

    def __load_env_file(self) -> None:
        env_file_path = self.__project_root / "config" / f".env.{self.__env_name}"
        if env_file_path.exists():
            load_dotenv(dotenv_path=env_file_path)
            logger.info("Loaded environment variables from {}", env_file_path)
        else:
            default_env_file_path = self.__project_root / "env" / ".env.local"

            if default_env_file_path.exists():
                load_dotenv(dotenv_path=default_env_file_path)
                logger.info(
                    "Loaded environment variables from {}", default_env_file_path
                )
            else:
                logger.warning(
                    "No environment variables file found for {}", self.__env_name
                )

    def __load_config(self, config_file: Optional[str | Path]) -> None:
        if config_file:
            config_file_path = config_file
        else:
            config_file_path = (
                self.__project_root / "config" / f"appsettings.{self.__env_name}.yaml"
            )

        try:
            with open(config_file_path, "r", encoding="u8") as file:
                self.__config_dic = safe_load(file) or {}
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Config file not found: {config_file_path}. Ensure config file exists for environment '{self.__env_name}'"
            )

    @property
    def database_config(self) -> DatabaseConfig:
        database = self.__config_dic.get("database", {})
        return DatabaseConfig(**database)

    @property
    def jwt_config(self) -> JwtConfig:
        jwt = self.__config_dic.get("jwt", {})
        return JwtConfig(**jwt)

    @property
    def api_config(self) -> ApiConfig:
        api = self.__config_dic.get("api", {})
        return ApiConfig(**api)

    @property
    def cors_config(self) -> CorsConfig:
        cors = self.__config_dic.get("cors", {})
        return CorsConfig(**cors)

    @property
    def nppa_config(self) -> NPPAConfig:
        nppa = self.__config_dic.get("nppa", {})
        return NPPAConfig(**nppa)
