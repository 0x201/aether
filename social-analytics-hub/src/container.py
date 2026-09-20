from dependency_injector import containers, providers
from dependency_injector.providers import Factory

from src.cache import CacheSession
from src.core import AppConfig
from src.database.providers import provide_db_manager
from src.messaging import EventBus
from src.repositories import DanmakuRepo
from src.schedulers import ScheduledDanmakuAnalyzer
from src.services import AnalyticsNotificationService, DanmakuAnalyzer


class AppContainer(containers.DeclarativeContainer):
    app_config = providers.Singleton(AppConfig)

    wiring_config = containers.WiringConfiguration(modules=["src.api.routes.danmaku"])

    # ==================================================
    # Infrastructure
    # ==================================================
    # Postgresql database manager
    db_manager = providers.Resource(
        provide_db_manager, config=app_config().databases.postgres
    )
    event_bus = providers.Singleton(
        EventBus,
        app_config=app_config(),
    )
    cache_session = providers.Singleton(CacheSession, app_config=app_config())

    # ==================================================
    # Repositories
    # ==================================================
    danmaku_repo: Factory[DanmakuRepo] = providers.Factory(
        DanmakuRepo, db_manager=db_manager
    )

    # ==================================================
    # Services
    # ==================================================
    analytics_notifier = providers.Factory(AnalyticsNotificationService, event_bus=event_bus)
    danmaku_analyzer = providers.Factory(
        DanmakuAnalyzer,
        db_manager=db_manager,
        notifier=analytics_notifier,
        cache_session=cache_session,
    )

    # ==================================================
    # Schedulers
    # ==================================================
    scheduled_danmaku_analyzer = providers.Factory(
        ScheduledDanmakuAnalyzer,
        db_manager=db_manager,
        danmaku_analyzer=danmaku_analyzer,
        event_bus=event_bus,
    )


def create_app_conatiner() -> AppContainer:
    return AppContainer()
