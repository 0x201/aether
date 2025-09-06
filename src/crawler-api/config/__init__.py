from typing import Optional

from .app_config import (
    AppConfig,
    DatabaseConfig,
    JwtConfig,
    CorsConfig,
    ApiConfig,
    NPPAConfig,
)


class GlobalConfigProxy:
    def __init__(self):
        self.__config: Optional[AppConfig] = None

    def configure(self, config_instance: AppConfig) -> None:
        if not isinstance(config_instance, AppConfig):
            raise TypeError(
                f"Expected AppConfig instance, got" f"{type(config_instance).__name__}"
            )
        if self.__config:
            raise RuntimeError(
                "Configuration is already configured. Call reset() first if reconfiguration is needed."
            )
        self.__config = config_instance

    def reset(self) -> None:
        self.__config = None

    def __ensure_configured(self) -> AppConfig:
        if self.__config is None:
            raise RuntimeError(
                "Configuration is not configured. Call configure() first with AppConfig instance."
            )
        return self.__config

    @property
    def database_config(self) -> DatabaseConfig:
        return self.__ensure_configured().database_config

    @property
    def jwt_config(self) -> JwtConfig:
        return self.__ensure_configured().jwt_config

    @property
    def cors_config(self) -> CorsConfig:
        return self.__ensure_configured().cors_config

    @property
    def api_config(self) -> ApiConfig:
        return self.__ensure_configured().api_config

    @property
    def nppa_config(self) -> NPPAConfig:
        return self.__ensure_configured().nppa_config

    def is_configure(self) -> bool:
        return self.__config is not None

    def __bool__(self) -> bool:
        return self.__config is not None

    def __repr__(self) -> str:
        if self.__config is None:
            return "GlobalConfigProxy(uninitialized)"
        return f"GlobalConfigProxy({repr(self.__config)})"


config = GlobalConfigProxy()


def configure(config_instance: AppConfig) -> None:
    config.configure(config_instance)


def is_configured() -> bool:
    return config.is_configure()


def reset() -> None:
    config.reset()


__all__ = [
    "config",
    "configure",
    "is_configured",
    "reset",
    "AppConfig",
    "DatabaseConfig",
    "JwtConfig",
    "CorsConfig",
    "ApiConfig",
    "NPPAConfig",
]
