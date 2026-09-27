"""组合根与接口契约测试：容器装配、应用装配、OpenAPI。"""

from inspect import signature

from src.app import app, create_app
from src.container import AppContainer, get_container
from test.infrastructure.fakes import FakeManagerProvider

sentinel = object()


class TestContainerWiring:
    """回归：此前容器把 `db_manager` 传给期望 `danmaku_repo` 的服务，装配即失败。"""

    def test_service_signatures_match_provider_kwargs(self):
        from src.application.danmaku.services import DanmakuAnalyzer
        from src.infrastructure.schedulers import ScheduledDanmakuAnalyzer

        analyzer_kwargs = set(AppContainer.danmaku_analyzer.kwargs.keys())
        analyzer_params = set(signature(DanmakuAnalyzer.__init__).parameters) - {"self"}
        assert analyzer_kwargs == analyzer_params

        scheduler_kwargs = set(AppContainer.scheduled_danmaku_analyzer.kwargs.keys())
        scheduler_params = set(
            signature(ScheduledDanmakuAnalyzer.__init__).parameters
        ) - {"self"}
        assert scheduler_kwargs == scheduler_params

    def test_provider_names_used_by_api_dependencies_exist(self):
        from src.api import dependencies as deps

        container = AppContainer()
        for name in (
            "danmaku_repository",
            "danmaku_analyzer",
            "analytics_notifier",
            "generate_analysis_handler",
            "precompute_all_rooms_handler",
            "list_danmaku_handler",
            "danmaku_statistics_handler",
            "word_frequency_handler",
            "wordcloud_handler",
            "scheduled_danmaku_analyzer",
        ):
            assert hasattr(container, name), f"容器缺少 provider: {name}"

        assert callable(deps.get_list_danmaku_handler)

    def test_repositories_are_bound_to_db_manager_provider(self):
        assert "db_manager" in AppContainer.danmaku_repository.kwargs
        assert "db_manager" in AppContainer.capture_job_repository.kwargs
        assert "db_manager" in AppContainer.danmaku_analysis_repository.kwargs
        assert len(AppContainer.danmaku_repository.kwargs) == 1

    def test_handlers_are_bound_to_expected_dependencies(self):
        assert "analyzer" in AppContainer.generate_analysis_handler.kwargs
        assert "analyzer" in AppContainer.precompute_all_rooms_handler.kwargs
        assert "repository" in AppContainer.list_danmaku_handler.kwargs
        assert "repository" in AppContainer.danmaku_statistics_handler.kwargs
        assert "analyzer" in AppContainer.word_frequency_handler.kwargs
        assert "analyzer" in AppContainer.wordcloud_handler.kwargs

    def test_danmaku_analyzer_graph_resolves_with_fake_db(self):
        container = AppContainer()
        container.db_manager.override(FakeManagerProvider())

        try:
            analyzer = container.danmaku_analyzer()
            assert analyzer.danmaku_repo is not None
            assert analyzer.analysis_repo is not None
            assert analyzer.frequency_service is not None

            handler = container.list_danmaku_handler()
            assert handler._repository is not None
        finally:
            container.db_manager.reset_override()

    def test_no_provider_is_an_awaitable(self):
        """回归：异步 `providers.Resource` 会让容器注入未 await 的 Future。"""
        import inspect

        container = AppContainer()
        container.db_manager.override(FakeManagerProvider())

        try:
            for name in (
                "db_manager",
                "danmaku_repository",
                "capture_job_repository",
                "danmaku_analysis_repository",
                "danmaku_analyzer",
                "generate_analysis_handler",
                "scheduled_danmaku_analyzer",
            ):
                value = getattr(container, name)()
                assert not inspect.isawaitable(value), f"{name} 返回了 awaitable"
        finally:
            container.db_manager.reset_override()

    def test_get_container_requires_state(self):
        class FakeState:
            pass

        class FakeApp:
            state = FakeState()

        class FakeRequest:
            app = FakeApp()

        try:
            get_container(FakeRequest())
        except RuntimeError as error:
            assert "not attached" in str(error)
        else:
            raise AssertionError("missing container should raise RuntimeError")

    def test_get_container_returns_attached_container(self):
        class FakeState:
            def __init__(self) -> None:
                self.container = sentinel

        class FakeApp:
            state = FakeState()

        class FakeRequest:
            app = FakeApp()

        assert get_container(FakeRequest()) is sentinel

    def test_config_is_singleton(self):
        container = AppContainer()
        assert container.app_config() is container.app_config()

    def test_frequency_service_is_singleton(self):
        container = AppContainer()
        assert container.frequency_service() is container.frequency_service()


class TestApplicationAssembly:
    def test_module_level_app_exists(self):
        assert app.title

    def test_expected_routes_are_registered(self):
        paths = app.openapi()["paths"]
        assert set(paths) >= {
            "/danmakus/",
            "/danmakus/statistics",
            "/danmakus/word-frequency",
            "/danmakus/wordcloud",
            "/danmakus/analysis/generate",
            "/health",
        }

    def test_openapi_schema_is_generatable(self):
        schema = app.openapi()
        assert schema["info"]["title"] == app.title
        assert schema["info"]["version"] == app.version

    def test_analysis_request_schema_exposes_optional_fields(self):
        schema = app.openapi()
        props = schema["components"]["schemas"]["AnalysisGenerateRequest"]["properties"]
        assert set(props) >= {
            "start_time",
            "end_time",
            "room_id",
            "period_type",
            "top_n",
        }
        schemas = schema["components"]["schemas"]["AnalysisGenerateRequest"]
        required = schemas["required"]
        assert set(required) == {"start_time", "end_time"}

    def test_create_app_attaches_container(self):
        new_app = create_app()
        container = new_app.state.container

        assert container is not None
        assert hasattr(container, "danmaku_analyzer")
        assert container.app_config().project_name

    def test_health_and_root_routes_are_registered(self):
        from fastapi.routing import APIRoute

        paths = {route.path for route in app.routes if isinstance(route, APIRoute)}
        assert {"/", "/health", "/scalar"} <= paths


class TestAppContainerConfig:
    def test_provider_kwargs_are_plain_strings(self):
        """`providers.Factory` 的 kwargs 必须是字段名，拼错只会在运行时暴露。"""
        for name in (
            "danmaku_repository",
            "capture_job_repository",
            "danmaku_analysis_repository",
        ):
            provider = getattr(AppContainer, name)
            for key in provider.kwargs:
                assert isinstance(key, str) and key.isidentifier()

    def test_container_is_dynamic_container_instance(self):
        """dependency_injector 的声明式容器实例化后即为 DynamicContainer。"""
        container = AppContainer()
        assert hasattr(container, "app_config")
        assert container.app_config() is not None
