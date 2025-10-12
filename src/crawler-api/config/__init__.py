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
        self._lock = threading.Lock()
        self._initialized = False

    def configure(self, config_instance: Optional[AppConfig] = None) -> None:
        """Configure the global config with a specific instance."""
        with self._lock:
            if not self._initialized:
                self._config = config_instance or AppConfig()
                self._initialized = True

    @property
    def app_config(self) -> AppConfig:
        if not self._initialized:
            self.configure()
        return self._config


config = GlobalConfigProxy()


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
