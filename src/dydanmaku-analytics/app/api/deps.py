from typing import Annotated, Generator

from app.database import SessionConnector, DanmakuRepository
from app.services import DanmakuAnalyzer
from fastapi import Depends
from sqlalchemy.orm import Session

# Initialize session connector
session_connector = SessionConnector()


# Dependency to get database session
def get_db() -> Generator[Session, None, None]:
    with session_connector.get_session() as session:
        yield session


def get_danmaku_analyzer():
    return DanmakuAnalyzer()



SessionDep = Annotated[Session, Depends(get_db)]


def get_danmaku_repository(session: SessionDep) -> DanmakuRepository:
    return DanmakuRepository(session)


DanmakuAnalyzerDep = Annotated[DanmakuAnalyzer, Depends(get_danmaku_analyzer)]
DanmakuRepositoryDep = Annotated[DanmakuRepository, Depends(get_danmaku_repository)]
