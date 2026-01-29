from typing import Annotated

from app.database import DanmakuRepository, NPPARepository
from app.services import DanmakuAnalyzer
from app.cache import CacheSession
from fastapi import Depends
from dependency_injector.wiring import Provide
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
CacheSessionDep = Annotated[
    CacheSession, Depends(Provide[Container.cache_session])
]