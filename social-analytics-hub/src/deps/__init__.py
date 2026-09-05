from typing import Annotated

from dependency_injector.wiring import Provide
from fastapi import Depends

from src.cache import CacheSession
from src.database import DanmakuRepository
from src.services import DanmakuAnalyzer

from .container import AppContainer

DanmakuAnalyzerDep = Annotated[
    DanmakuAnalyzer, Depends(Provide[AppContainer.danmaku_analyzer])
]
DanmakuRepositoryDep = Annotated[
    DanmakuRepository, Depends(Provide[AppContainer.danmaku_repository])
]
CacheSessionDep = Annotated[CacheSession, Depends(Provide[AppContainer.cache_session])]
