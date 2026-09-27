"""应用生命周期测试：在替换掉日志/遥测/调度等副作用后驱动 lifespan。"""

import pytest
from fastapi import FastAPI

from src import app as app_module
from src.container import create_app_container
from test.infrastructure.fakes import FakeManagerProvider


class FakeConfig:
    project_name = "test"
    version = "0"
    otel_service_name = "svc"


class FakeContainer:
    def __init__(self, db_manager: FakeManagerProvider) -> None:
        self._db_manager = db_manager
        self.config = FakeConfig()

    def db_manager(self) -> FakeManagerProvider:
        return self._db_manager

    def app_config(self) -> FakeConfig:
        return self.config


@pytest.fixture
def patched_lifespan(mocker):
    db_manager = FakeManagerProvider()
    container = FakeContainer(db_manager)
    app = FastAPI()
    app.state.container = container

    mocker.patch.object(app_module, "setup_logging")
    mocker.patch.object(app_module, "configure_opentelemetry")
    set_container = mocker.patch.object(app_module, "set_container")
    start_tasks = mocker.patch.object(app_module, "start_scheduled_tasks")
    stop_tasks = mocker.patch.object(app_module, "stop_scheduled_tasks")

    return app, db_manager, set_container, start_tasks, stop_tasks


class TestLifespan:
    async def test_initialises_and_disposes_database_manager(self, patched_lifespan):
        app, db_manager, set_container, start_tasks, stop_tasks = patched_lifespan

        async with app_module.lifespan(app):
            assert db_manager.initialised == 1
            set_container.assert_called_once()
            start_tasks.assert_called_once()
            stop_tasks.assert_not_called()

        stop_tasks.assert_called_once()
        assert db_manager.disposed == 1

    async def test_disposes_even_when_body_raises(self, patched_lifespan):
        app, db_manager, _set_container, _start, stop_tasks = patched_lifespan

        with pytest.raises(RuntimeError):
            async with app_module.lifespan(app):
                raise RuntimeError("boom")

        stop_tasks.assert_called_once()
        assert db_manager.disposed == 1


class TestCreateAppContainer:
    def test_returns_container_with_config(self):
        container = create_app_container()
        assert container.app_config().project_name

    def test_db_manager_provider_is_not_initialised_eagerly(self):
        container = create_app_container()
        provider = container.db_manager()

        assert provider.is_initialized is False
        with pytest.raises(RuntimeError, match="not initialized"):
            provider()
