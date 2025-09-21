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
        self._config: Optional[AppConfig] = None

    def configure(self, config_instance: AppConfig) -> None:
        """Configure the global config with a specific instance."""
        if not isinstance(config_instance, AppConfig):
            raise TypeError(
                f"Expected AppConfig instance, got {type(config_instance).__name__}"
            )
        if self._config is not None:
            raise RuntimeError(
                "Configuration is already configured. Call reset() first if reconfiguration is needed."
            )
        self._config = config_instance

    def _ensure_configured(self) -> AppConfig:
        """Ensure config is initialized, create default instance if needed."""
        if self._config is None:
            raise RuntimeError(
                "Configuration is not configured. Call configure() first."
            )
        return self._config

    @property
    def database_config(self) -> DatabaseConfig:
        return self._ensure_configured().database_config

    @property
    def jwt_config(self) -> JwtConfig:
        return self._ensure_configured().jwt_config

    @property
    def cors_config(self) -> CorsConfig:
        return self._ensure_configured().cors_config

    @property
    def api_config(self) -> ApiConfig:
        return self._ensure_configured().api_config

    @property
    def nppa_config(self) -> NPPAConfig:
        return self._ensure_configured().nppa_config

    def is_configured(self) -> bool:
        """Check if config has been explicitly configured."""
        return self._config is not None

    def reset(self) -> None:
        """Reset the configuration to uninitialized state."""
        self._config = None

    def __bool__(self) -> bool:
        return self._config is not None

    def __repr__(self) -> str:
        if self._config is None:
            return "GlobalConfigProxy(uninitialized)"
        return f"GlobalConfigProxy({repr(self._config)})"


config = GlobalConfigProxy()


def configure(config_instance: AppConfig) -> None:
    """Configure the global config with a specific instance."""
    config.configure(config_instance)


def is_configured() -> bool:
    """Check if config has been explicitly configured."""
    return config.is_configured()


def reset() -> None:
    """Reset the configuration to uninitialized state."""
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
