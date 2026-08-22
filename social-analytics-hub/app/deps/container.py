from dependency_injector import containers, providers

from app.cache import CacheSession
from app.core import AppConfig
from app.database import DanmakuRepository, NPPARepository, SessionFactory
from app.messaging import EventBus
from app.schedulers import ScheduledDanmakuAnalyzer, ScheduledNPPACrawler
from app.services import AnalyticsNotification, DanmakuAnalyzer, NPPAGameAuditCrawler


class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    app_config = providers.Singleton(AppConfig)

    wiring_config = containers.WiringConfiguration(
        modules=["app.api.routes.danmaku", "app.api.routes.nppa"]
    )

    event_bus = providers.Singleton(
        EventBus,
        app_config=app_config(),
    )

    analytics_notification = providers.Singleton(
        AnalyticsNotification, event_bus=event_bus
    )

    session_factory = providers.Singleton(SessionFactory, app_config=app_config())

    cache_session = providers.Factory(CacheSession, app_config=app_config())

    danmaku_repository = providers.Factory(
        DanmakuRepository, session_factory=session_factory
    )
    nppa_repository = providers.Factory(NPPARepository, session_factory=session_factory)

    analytics_notifier = providers.Factory(AnalyticsNotification, event_bus=event_bus)

    danmaku_analyzer = providers.Factory(
        DanmakuAnalyzer,
        session_factory=session_factory,
        notifier=analytics_notifier,
        cache_session=cache_session,
    )
    nppa_crawler = providers.Factory(
        NPPAGameAuditCrawler,
        nppa_repository=nppa_repository,
    )

    scheduled_danmaku_analyzer = providers.Factory(
        ScheduledDanmakuAnalyzer,
        session_factory=session_factory,
        danmaku_analyzer=danmaku_analyzer,
        event_bus=event_bus,
    )
    scheduled_nppa_crawler = providers.Factory(
        ScheduledNPPACrawler, crawler=nppa_crawler
    )
