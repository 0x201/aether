# coding=utf-8
from contextlib import contextmanager
from typing import Optional, Iterator
from enum import Enum
from sqlalchemy import create_engine, URL, Engine
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
        self.host = server
        self.database = database
        self.port = port
        self.username = username
        self.password = password
        self.trusted_connection = trusted_connection
        self.session_local: Optional[sessionmaker] = None
        self.engine: Optional[Engine] = None

    def connect(self) -> None:
        if self.engine is not None:
            return

        if self.trusted_connection:
            url = URL.create(
                drivername="mssql+pymssql",
                host=self.host,
                port=self.port,
                database=self.database,
            )
        else:
            url = URL.create(
                drivername="mssql+pymssql",
                username=self.username,
                password=self.password,
                host=self.host,
                port=self.port,
                database=self.database,
            )

        self.engine = create_engine(url, future=True)
        self.session_local = sessionmaker(
            bind=self.engine, autoflush=False, autocommit=False, future=True
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
        if self.engine is None or self.session_local is None:
            self.connect()

        assert self.session_local is not None
        return self.session_local()
