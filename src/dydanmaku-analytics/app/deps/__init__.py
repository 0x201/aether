from typing import Annotated

from dependency_injector.wiring import Provide
from fastapi import Depends

from app.cache import CacheSession
from app.database import DanmakuRepository, NPPARepository
from app.services import DanmakuAnalyzer

from .container import Container

DanmakuAnalyzerDep = Annotated[
    DanmakuAnalyzer, Depends(Provide[Container.danmaku_analyzer])
]
DanmakuRepositoryDep = Annotated[
    DanmakuRepository, Depends(Provide[Container.danmaku_repository])
]
NPPARepositoryDep = Annotated[
    NPPARepository, Depends(Provide[Container.nppa_repository])
]
CacheSessionDep = Annotated[CacheSession, Depends(Provide[Container.cache_session])]
