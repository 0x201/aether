from .models import AppConfig
from .config_loader import load_config_file

config = load_config_file()

__all__ = ["AppConfig", "config", "load_config_file"]