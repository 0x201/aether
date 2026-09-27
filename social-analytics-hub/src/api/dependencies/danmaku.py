"""FastAPI 依赖绑定：把容器中的 provider 暴露为 `Annotated` 依赖别名。"""

from typing import Annotated

from fastapi import Depends

from src.application.danmaku.commands import (
    GenerateAnalysisHandler,
    PrecomputeAllRoomsHandler,
)
from src.application.danmaku.queries import (
    GetDanmakuStatisticsHandler,
    GetWordcloudHandler,
    GetWordFrequencyHandler,
    ListDanmakuHandler,
)
from src.application.danmaku.services import (
    AnalyticsNotificationService,
    DanmakuAnalyzer,
)
from src.container import AppContainer, get_container
from src.domain.danmaku.repositories import DanmakuRepository


def get_danmaku_repository(
    container: Annotated[AppContainer, Depends(get_container)],
) -> DanmakuRepository:
    return container.danmaku_repository()


def get_danmaku_analyzer(
    container: Annotated[AppContainer, Depends(get_container)],
) -> DanmakuAnalyzer:
    return container.danmaku_analyzer()


def get_danmaku_notifier(
    container: Annotated[AppContainer, Depends(get_container)],
) -> AnalyticsNotificationService:
    return container.analytics_notifier()


def get_generate_analysis_handler(
    container: Annotated[AppContainer, Depends(get_container)],
) -> GenerateAnalysisHandler:
    return container.generate_analysis_handler()


def get_precompute_all_rooms_handler(
    container: Annotated[AppContainer, Depends(get_container)],
) -> PrecomputeAllRoomsHandler:
    return container.precompute_all_rooms_handler()


def get_list_danmaku_handler(
    container: Annotated[AppContainer, Depends(get_container)],
) -> ListDanmakuHandler:
    return container.list_danmaku_handler()


def get_danmaku_statistics_handler(
    container: Annotated[AppContainer, Depends(get_container)],
) -> GetDanmakuStatisticsHandler:
    return container.danmaku_statistics_handler()


def get_word_frequency_handler(
    container: Annotated[AppContainer, Depends(get_container)],
) -> GetWordFrequencyHandler:
    return container.word_frequency_handler()


def get_wordcloud_handler(
    container: Annotated[AppContainer, Depends(get_container)],
) -> GetWordcloudHandler:
    return container.wordcloud_handler()


DanmakuRepositoryDep = Annotated[DanmakuRepository, Depends(get_danmaku_repository)]
DanmakuAnalyzerDep = Annotated[DanmakuAnalyzer, Depends(get_danmaku_analyzer)]
AnalyticsNotificationDep = Annotated[
    AnalyticsNotificationService, Depends(get_danmaku_notifier)
]
GenerateAnalysisHandlerDep = Annotated[
    GenerateAnalysisHandler, Depends(get_generate_analysis_handler)
]
PrecomputeAllRoomsHandlerDep = Annotated[
    PrecomputeAllRoomsHandler, Depends(get_precompute_all_rooms_handler)
]
ListDanmakuHandlerDep = Annotated[ListDanmakuHandler, Depends(get_list_danmaku_handler)]
DanmakuStatisticsHandlerDep = Annotated[
    GetDanmakuStatisticsHandler, Depends(get_danmaku_statistics_handler)
]
WordFrequencyHandlerDep = Annotated[
    GetWordFrequencyHandler, Depends(get_word_frequency_handler)
]
WordcloudHandlerDep = Annotated[GetWordcloudHandler, Depends(get_wordcloud_handler)]
