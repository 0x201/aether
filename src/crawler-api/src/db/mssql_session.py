# coding=utf-8
from contextlib import contextmanager
from typing import Optional, Iterator
from enum import Enum
from sqlalchemy import create_engine, URL, Engine, text
from sqlalchemy.orm import sessionmaker, Session


class IntegratedAuthentication(Enum):
    ADI = "ActiveDirectoryIntegrated"


class MSSQLSession:
    def __init__(
        self,
        server: str,
        database: str,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        trusted_connection: Optional[bool] = None,
    ):
        self._host = server
        self._database = database
        self._port = port
        self._username = username
        self._password = password
        self._trusted_connection = trusted_connection
        self._session_local: Optional[sessionmaker] = None
        self._engine: Optional[Engine] = None

    def connect(self) -> None:
        if self._engine is not None:
            return

        if self._trusted_connection:
            url = URL.create(
                drivername="mssql+pymssql",
                host=self._host,
                port=self._port,
                database=self._database,
            )
        else:
            url = URL.create(
                drivername="mssql+pymssql",
                username=self._username,
                password=self._password,
                host=self._host,
                port=self._port,
                database=self._database,
            )

        self._engine = create_engine(url, future=True)
        self._session_local = sessionmaker(
            bind=self._engine, autoflush=False, autocommit=False, future=True
        )

    @contextmanager
    def get_session(self) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
        finally:
            session.close()

    @contextmanager
    def get_transaction(self, autocommit=True) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
            if autocommit:
                session.commit()
        except Exception:
            if autocommit:
                session.rollback()
            raise
        finally:
            session.close()

    def _create_session(self) -> Session:
        if self._engine is None or self._session_local is None:
            self.connect()

        assert self._session_local is not None
        return self._session_local()
