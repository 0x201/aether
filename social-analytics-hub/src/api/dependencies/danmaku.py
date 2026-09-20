from typing import Annotated

from fastapi import Depends

from src.container import AppContainer
from src.deps import get_container
from src.services import AnalyticsNotificationService, DanmakuAnalyzer


def get_danmaku_analyzer(
    container: AppContainer = Depends(get_container),
) -> DanmakuAnalyzer:
    return container.danmaku_analyzer()


def get_danmaku_notifier(
    container: AppContainer = Depends(get_container),
) -> AnalyticsNotificationService:
    return container.analytics_notifier()


DanmakuAnalyzerDep = Annotated[
    DanmakuAnalyzer,
    Depends(get_danmaku_analyzer),
]

AnalyticsNotificationDep = Annotated[
    AnalyticsNotificationService,
    Depends(get_danmaku_notifier),
]
