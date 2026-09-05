from dependency_injector import containers, providers

from src.cache import CacheSession
from src.core import AppConfig
from src.database import DanmakuRepository, SessionFactory
from src.messaging import EventBus
from src.schedulers import ScheduledDanmakuAnalyzer
from src.services.analytics_notification import AnalyticsNotification
from src.services.analyze_danmaku import DanmakuAnalyzer


class AppContainer(containers.DeclarativeContainer):
    config = providers.Configuration()

    app_config = providers.Singleton(AppConfig)

    wiring_config = containers.WiringConfiguration(
        modules=["src.api.routes.danmaku"]
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

    analytics_notifier = providers.Factory(AnalyticsNotification, event_bus=event_bus)

    danmaku_analyzer = providers.Factory(
        DanmakuAnalyzer,
        session_factory=session_factory,
        notifier=analytics_notifier,
        cache_session=cache_session,
    )

    scheduled_danmaku_analyzer = providers.Factory(
        ScheduledDanmakuAnalyzer,
        session_factory=session_factory,
        danmaku_analyzer=danmaku_analyzer,
        event_bus=event_bus,
    )
