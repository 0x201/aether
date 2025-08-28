# coding=utf-8
from contextlib import contextmanager
from typing import Optional, Iterator, List, Any, Dict

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
            authentication: Optional[str] = None
    ):
        self.__host = server
        self.__database = database
        self.__port = port
        self.__username = username
        self.__password = password
        self.__trusted_connection = trusted_connection
        self.__authentication = authentication
        self.__session_local: Optional[sessionmaker] = None
        self.__engine: Optional[Engine] = None

    def connect(self) -> None:
        if self.__engine is not None:
            return

        if self.__authentication == IntegratedAuthentication.ADI:
            url = URL.create(
                drivername="mssql+pymssql",
                username=self.__username,
                host=self.__host,
                port=self.__port,
                database=self.__database,
                query={
                    "Authentication": "ActiveDirectoryIntegrated",
                    #"Encrypt": "Yes",
                    #"TrustServerCertificate": "Yes"
                }
            )
        elif self.__trusted_connection:
            url = URL.create(
                drivername="mssql+pymssql",
                host=self.__host,
                port=self.__port,
                database=self.__database,
                query={
                    "Trusted_Connection": "Yes",
                    #"Encrypt": "Yes",
                    "TrustServerCertificate": "Yes"
                }
            )
        else:
            url = URL.create(
                drivername="mssql+pymssql",
                username=self.__username,
                password=self.__password,
                host=self.__host,
                port=self.__port,
                database=self.__database,
                query={
                    #"Encrypt": "Yes",
                    #"TrustServerCertificate": "Yes"
                }
            )

        self.__engine = create_engine(url, future=True)
        self.__session_local = sessionmaker(
            bind=self.__engine,
            autoflush=False,
            autocommit=False,
            future=True
        )

    @contextmanager
    def get_session(self) -> Iterator[Session]:
        session: Session = self.create_session()
        try:
            yield session
            session.commit()
        except Exception as ex:
            session.rollback()
            logger.error("{}", ex)
            raise
        finally:
            session.close()

    def create_session(self) -> Session:
        if self.__engine is None or self.__session_local is None:
            self.connect()

        assert self.__session_local is not None
        return self.__session_local()

    def fetch_as_dict(self, sql: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
        with self.get_session() as session:
            result = session.execute(text(sql), params)
            rows = result.fetchall()
            if not rows:
                return []
            cols = result.keys()
            return [dict(zip(cols, row)) for row in rows if rows is not None]
