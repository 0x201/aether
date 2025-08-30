from typing import Optional

from src.db.session import MSSQLSession
from config import config
from config.app_config import DatabaseConfig


class SessionConnector:
    def __init__(self):
        self.__database_config: Optional[DatabaseConfig] = None
        self.__database_instance: Optional[MSSQLSession] = None

    def __get_database_config(self) -> DatabaseConfig:
        if self.__database_config is None:
            self.__database_config = config.database_config
        return self.__database_config

    def __get_database(self) -> MSSQLSession:
        if self.__database_instance is None:
            database_config = self.__get_database_config()
            self.__database_instance = MSSQLSession(
                server=database_config.server,
                database=database_config.database,
                port=database_config.port,
                username=database_config.username,
                password=database_config.password,
                trusted_connection=database_config.trusted_connection,
            )
        return self.__database_instance

    def get_session(self):
        db = self.__get_database()
        return db.get_session()
