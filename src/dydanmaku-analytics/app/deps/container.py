from dependency_injector import containers, providers
from app.database import SessionFactory
from app.messaging import EventBus
from app.cache import CacheSession
from app.services import AnalyticsNotification, DanmakuAnalyzer, NPPAGameAuditCrawler
from app.database import DanmakuRepository, NPPARepository
from app.schedulers import ScheduledDanmakuAnalyzer, ScheduledNPPACrawler


class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    wiring_config = containers.WiringConfiguration(
        modules=["app.api.routes.danmaku", "app.api.routes.nppa"]
    )

    event_bus = providers.Singleton(EventBus, exchange_name="mc_event_bus")

    analytics_notification = providers.Singleton(
        AnalyticsNotification, event_bus=event_bus
    )

    session_factory = providers.Singleton(SessionFactory)

    cache_session = providers.Factory(CacheSession)

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
