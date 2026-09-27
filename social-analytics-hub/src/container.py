from __future__ import annotations

from dependency_injector import containers, providers
from dependency_injector.providers import Factory
from fastapi import Request

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
from src.core import AppConfig
from src.domain.danmaku.repositories import (
    CaptureJobRepository,
    DanmakuAnalysisRepository,
    DanmakuRepository,
)
from src.domain.danmaku.services import WordFrequencyDomainService
from src.infrastructure.cache import CacheSession
from src.infrastructure.database.providers import DatabaseManagerProvider
from src.infrastructure.messaging import EventBus
from src.infrastructure.persistence.repositories.capture_job_repository import (
    PostgresCaptureJobRepository,
)
from src.infrastructure.persistence.repositories.danmaku_analysis_repository import (
    PostgresDanmakuAnalysisRepository,
)
from src.infrastructure.persistence.repositories.danmaku_repository import (
    PostgresDanmakuRepository,
)
from src.infrastructure.schedulers import ScheduledDanmakuAnalyzer


class AppContainer(containers.DeclarativeContainer):
    app_config = providers.Singleton(AppConfig)

    # ==================================================
    # Infrastructure
    # ==================================================
    # 注意：必须同步返回管理器实例，不能使用 providers.Resource（异步生成器会
    # 把未 await 的 Future 注入到所有下游 provider）。见 providers.py 说明。
    db_manager = providers.Singleton(
        DatabaseManagerProvider, config=app_config().databases.postgres
    )
    event_bus = providers.Singleton(EventBus, app_config=app_config())
    cache_session = providers.Singleton(CacheSession, app_config=app_config())

    # ==================================================
    # Domain services
    # ==================================================
    frequency_service = providers.Singleton(WordFrequencyDomainService)

    # ==================================================
    # Repositories
    # ==================================================
    danmaku_repository: Factory[DanmakuRepository] = providers.Factory(
        PostgresDanmakuRepository, db_manager=db_manager
    )
    capture_job_repository: Factory[CaptureJobRepository] = providers.Factory(
        PostgresCaptureJobRepository, db_manager=db_manager
    )
    danmaku_analysis_repository: Factory[DanmakuAnalysisRepository] = providers.Factory(
        PostgresDanmakuAnalysisRepository, db_manager=db_manager
    )

    # ==================================================
    # Application services
    # ==================================================
    analytics_notifier = providers.Factory(
        AnalyticsNotificationService, event_bus=event_bus
    )
    danmaku_analyzer = providers.Factory(
        DanmakuAnalyzer,
        danmaku_repo=danmaku_repository,
        analysis_repo=danmaku_analysis_repository,
        notifier=analytics_notifier,
        cache_session=cache_session,
        frequency_service=frequency_service,
    )

    # ==================================================
    # Use case handlers
    # ==================================================
    generate_analysis_handler = providers.Factory(
        GenerateAnalysisHandler, analyzer=danmaku_analyzer
    )
    precompute_all_rooms_handler = providers.Factory(
        PrecomputeAllRoomsHandler, analyzer=danmaku_analyzer
    )
    list_danmaku_handler = providers.Factory(
        ListDanmakuHandler, repository=danmaku_repository
    )
    danmaku_statistics_handler = providers.Factory(
        GetDanmakuStatisticsHandler, repository=danmaku_repository
    )
    word_frequency_handler = providers.Factory(
        GetWordFrequencyHandler, analyzer=danmaku_analyzer
    )
    wordcloud_handler = providers.Factory(
        GetWordcloudHandler, analyzer=danmaku_analyzer
    )

    # ==================================================
    # Schedulers
    # ==================================================
    scheduled_danmaku_analyzer = providers.Factory(
        ScheduledDanmakuAnalyzer,
        danmaku_analyzer=danmaku_analyzer,
    )


def create_app_container() -> AppContainer:
    return AppContainer()


#: 保留旧拼写以兼容既有引用
create_app_conatiner = create_app_container


def get_container(request: Request) -> AppContainer:
    container = getattr(request.app.state, "container", None)
    if container is None:
        raise RuntimeError("AppContainer is not attached to app.state")
    return container
