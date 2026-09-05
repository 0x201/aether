import os
from collections.abc import Iterator
from contextlib import contextmanager

from loguru import logger
from sqlalchemy import URL, Engine, create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from src.core.config import AppConfig
from src.core.model import DatabaseConfig


class MSSQLSession:
    def __init__(
        self,
        server: str,
        database: str,
        port: int | None = None,
        username: str | None = None,
        password: str | None = None,
        trusted_connection: bool | None = None,
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
        self.session_local: sessionmaker | None = None
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_pre_ping = pool_pre_ping
        self.pool_recycle = pool_recycle
        self.engine: Engine | None = None
        self._connected = False

    @contextmanager
    def query(self) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
        except Exception:
            raise
        finally:
            session.close()

    @contextmanager
    def transaction(self, autocommit=True) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
            if autocommit:
                session.commit()
        except Exception as e:
            if autocommit:
                session.rollback()
            logger.error(f"Transaction failed: {str(e)}")
            raise
        finally:
            session.close()

    def _connect(self) -> None:
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
                future=True,
            )

            self.session_local = sessionmaker(
                bind=self.engine, autoflush=False, autocommit=False, future=True
            )
            self._connected = True
            logger.info(
                f"successfully connected to database {self.database} on {self.host}"
            )
        except Exception as e:
            logger.error(f"failed to connect to database {str(e)}")
            raise e

    def _create_session(self) -> Session:
        if self.engine is None or self.session_local is None:
            self._connect()

        assert self.session_local is not None
        return self.session_local()

    def close(self) -> None:
        """Close database engine and clean up resources."""
        if self.engine:
            self.engine.dispose()
            self.engine = None
        self._connected = False
        self.session_local = None


class SQLiteSession:
    def __init__(
        self,
        database_path: str,
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_pre_ping: bool = True,
        pool_recycle: int = 3600,
    ):
        self.database_path = database_path
        self.session_local: sessionmaker | None = None
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_pre_ping = pool_pre_ping
        self.pool_recycle = pool_recycle
        self.engine: Engine | None = None
        self._connected = False

    @contextmanager
    def query(self) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
        except Exception:
            raise
        finally:
            session.close()

    @contextmanager
    def transaction(self, autocommit=True) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
            if autocommit:
                session.commit()
        except Exception as e:
            if autocommit:
                session.rollback()
            logger.error(f"Transaction failed: {str(e)}")
            raise
        finally:
            session.close()

    def _connect(self) -> None:
        if self._connected:
            return
        try:
            # Ensure directory exists
            db_dir = os.path.dirname(self.database_path)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir)

            # Create SQLite engine
            self.engine = create_engine(
                f"sqlite:///{self.database_path}",
                pool_pre_ping=self.pool_pre_ping,
                pool_recycle=self.pool_recycle,
                future=True,
                echo=False,
            )

            self.session_local = sessionmaker(
                bind=self.engine, autoflush=False, autocommit=False, future=True
            )
            self._connected = True
            logger.info(
                f"successfully connected to SQLite database {self.database_path}"
            )
        except Exception as e:
            logger.error(f"failed to connect to SQLite database {str(e)}")
            raise e

    def _create_session(self) -> Session:
        if self.engine is None or self.session_local is None:
            self._connect()

        assert self.session_local is not None
        return self.session_local()

    def close(self) -> None:
        """Close database engine and clean up resources."""
        if self.engine:
            self.engine.dispose()
            self.engine = None
        self._connected = False
        self.session_local = None


class PostgreSQLSession:
    def __init__(
        self,
        host: str,
        database: str,
        port: int | None = 5432,
        username: str | None = None,
        password: str | None = None,
        dbschema: str | None = None,
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_pre_ping: bool = True,
        pool_recycle: int = 3600,
    ):
        self.host = host
        self.database = database
        self.port = port
        self.username = username
        self.password = password
        self.dbschema = dbschema
        self.session_local: scoped_session | None = None
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_pre_ping = pool_pre_ping
        self.pool_recycle = pool_recycle
        self.engine: Engine | None = None
        self._connected = False

    @contextmanager
    def query(self) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
        except Exception:
            raise
        finally:
            session.close()

    @contextmanager
    def transaction(self, autocommit=True) -> Iterator[Session]:
        session: Session = self._create_session()
        try:
            yield session
            if autocommit:
                session.commit()
        except Exception as e:
            if autocommit:
                session.rollback()
            logger.error(f"Transaction failed: {str(e)}")
            raise
        finally:
            session.close()

    def _connect(self) -> None:
        if self._connected:
            return
        try:
            # Create PostgreSQL connection URL
            if self.username and self.password:
                url = URL.create(
                    drivername="postgresql+psycopg",
                    username=self.username,
                    password=self.password,
                    host=self.host,
                    port=self.port,
                    database=self.database,
                )
            else:
                # For authentication methods that don't require username/password
                url = URL.create(
                    drivername="postgresql+psycopg",
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
                future=True,
                connect_args={
                    "options": f"-csearch_path={self.dbschema or 'dydanmaku'}"
                },
            )

            self.session_local = scoped_session(
                sessionmaker(
                    bind=self.engine, autoflush=False, autocommit=False, future=True
                )
            )
            self._connected = True
            logger.info(
                f"successfully connected to PostgreSQL database {self.database} on {self.host}:{self.port}"
            )
        except Exception as e:
            logger.error(f"failed to connect to PostgreSQL database {str(e)}")
            raise e

    def _create_session(self) -> Session:
        if self.engine is None or self.session_local is None:
            self._connect()

        assert self.session_local is not None
        return self.session_local()

    def close(self) -> None:
        """Close database engine and clean up resources."""
        if self.engine:
            self.engine.dispose()
            self.engine = None
        self._connected = False
        self.session_local = None


class SessionFactory:
    def __init__(self, app_config: AppConfig):
        self.settings = app_config
        self.database_config: DatabaseConfig | None = None
        self.database_instance: MSSQLSession | SQLiteSession | PostgreSQLSession | None = None

    def _get_database_config(self) -> DatabaseConfig:
        if self.database_config is None:
            self.database_config = self.settings.databases
        return self.database_config

    def _get_database(self) -> MSSQLSession | SQLiteSession | PostgreSQLSession:
        if self.database_instance is None:
            database_config = self._get_database_config()

            if not database_config.postgres:
                raise ValueError("PostgreSQL config not found")
            self.database_instance = PostgreSQLSession(
                host=database_config.postgres.host,
                database=database_config.postgres.database,
                port=database_config.postgres.port,
                username=database_config.postgres.username,
                password=database_config.postgres.password,
            )
        return self.database_instance

    def query(self):
        db = self._get_database()
        return db.query()

    def transaction(self, autocommit=True):
        db = self._get_database()
        return db.transaction(autocommit=autocommit)
