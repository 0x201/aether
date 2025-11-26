import threading
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
        self._lock = threading.RLock()  # Using RLock to prevent deadlock
        self._initialized = False

    def configure(self, config_instance: Optional[AppConfig] = None) -> None:
        """Configure the global config with a specific instance."""
        with self._lock:
            if not self._initialized:
                self._config = config_instance or AppConfig()
                self._initialized = True

    def configure_with_params(self, env: Optional[str] = None, config_file_path: Optional[str] = None) -> None:
        """Configure the global config with environment and config file path."""
        with self._lock:
            if not self._initialized:
                self._config = AppConfig(env=env, config_file=config_file_path)
                self._initialized = True

    def reset(self) -> None:
        """Reset the global config to uninitialized state."""
        with self._lock:
            self._config = None
            self._initialized = False

    @property
    def app_config(self) -> AppConfig:
        with self._lock:
            if not self._initialized:
                self.configure()
            return self._config  # type: ignore


config = GlobalConfigProxy()


def configure(env: Optional[str] = None, config_file_path: Optional[str] = None) -> None:
    """Configure the global config with environment and config file path.
    
    Args:
        env: Environment name (local, dev, uat, prod). Defaults to "local" if not provided.
        config_file_path: Path to config file. 
            Defaults to "config/appsettings.{env}.yaml" if not provided.
    """
    config.configure_with_params(env, config_file_path)


def reset() -> None:
    """Reset the global config to uninitialized state."""
    config.reset()


def is_configured() -> bool:
    """Check if the global config has been initialized."""
    with config._lock:
        return config._initialized


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