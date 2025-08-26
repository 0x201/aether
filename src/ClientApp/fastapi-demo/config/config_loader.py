# coding=utf-8

import os
import yaml
from dotenv import load_dotenv
from .models import AppConfig


def load_config_file() -> AppConfig:
    current_path = os.path.abspath(__file__)
    current_dir = os.path.dirname(current_path)

    env_development_path = os.path.join(current_dir, ".env.development")
    env_local_path = os.path.join(current_dir, ".env.local")
    
    if os.path.exists(env_development_path):
        load_dotenv(env_development_path)
    elif os.path.exists(env_local_path):
        load_dotenv(env_local_path)

    environment = os.getenv("ENVIRONMENT", "local")

    config_file_name = f"appsettings.{environment}.yaml"
    config_path = os.path.join(current_dir, config_file_name)

    if not os.path.exists(config_path):
        config_path = os.path.join(current_dir, "..", "appsettings.yaml")
        if not os.path.exists(config_path):
            config_path = os.path.join(current_dir, "appsettings.yaml")

    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as file:
            config_dict = yaml.safe_load(file) or {}
            return AppConfig(**config_dict)
    else:
        return AppConfig()