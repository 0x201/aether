from typing import Optional
from config import config
from .mssql_session import MSSQLSession
from config.app_config import DatabaseConfig


class SessionConnector:
    def __init__(self):
        self._database_config: Optional[DatabaseConfig] = None
        self._database_instance: Optional[MSSQLSession] = None

    def _get_database_config(self) -> DatabaseConfig:
        if self._database_config is None:
            self._database_config = config.database_config
        return self._database_config

    def _get_database(self) -> MSSQLSession:
        if self._database_instance is None:
            database_config = self._get_database_config()
            self._database_instance = MSSQLSession(
                server=database_config.server,
                database=database_config.database,
                port=database_config.port,
                username=database_config.username,
                password=database_config.password,
                trusted_connection=database_config.trusted_connection,
            )
        return self._database_instance

    def get_session(self):
        db = self._get_database()
        return db.get_session()
    
    def get_transaction(self, autocommit=True):
        db = self._get_database()
        return db.get_transaction(autocommit=autocommit)
