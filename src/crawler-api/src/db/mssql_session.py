# coding=utf-8
from contextlib import contextmanager
from typing import Optional, Iterator
from enum import Enum
from sqlalchemy import create_engine, URL, Engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.logger import logger


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
            pool_size: int = 10,
            max_overflow: int = 20,
            pool_pre_ping: bool = True,
            pool_recycle: int = 3600,
    ):
        self.host = server
        self.database = database
        self.port = port
        self.username = username
        self.password = password
        self.trusted_connection = trusted_connection
        self.session_local: Optional[sessionmaker] = None
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_pre_ping = pool_pre_ping
        self.pool_recycle = pool_recycle
        self.engine: Optional[Engine] = None
        self._connected = False

    def connect(self) -> None:
        if self._connected:
            return
        try:
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

            self.engine = create_engine(
                url,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_pre_ping=self.pool_pre_ping,
                pool_recycle=self.pool_recycle,
                future=True)

            self.session_local = sessionmaker(
                bind=self.engine, autoflush=False, autocommit=False, future=True
            )
            self._connected = True
            logger.info(f"successfully connected to database {self.database} on {self.host}")
        except Exception as e:
            logger.error(f"failed to connect to database {str(e)}")
            raise e

    @contextmanager
    def get_session(self) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
        except SQLAlchemyError as e:
            logger.error(f"Database error during session: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during session: {str(e)}")
            raise
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
            logger.error(f"Transaction failed: {str(e)}")
            raise
        finally:
            session.close()

    def _create_session(self) -> Session:
        if self.engine is None or self.session_local is None:
            self.connect()

        assert self.session_local is not None
        return self.session_local()

    def close(self) -> None:
        """Close database engine and clean up resources."""
        if self.engine:
            self.engine.dispose()
            self.engine = None
        self._connected = False
        self.session_local = None
