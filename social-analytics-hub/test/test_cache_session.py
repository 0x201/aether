import pytest

from core import AppConfig
from src.cache.cache_session import CacheSession


class TestCacheSession:
    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        app_config = mocker.Mock(AppConfig)
        # Mock the settings to control the values
        self.mock_settings = mocker.patch("src.cache.cache_session.settings")
        self.mock_settings.cache.redis_host = "localhost"
        self.mock_settings.cache.redis_port = 6379
        self.mock_settings.cache.redis_password = None
        self.mock_settings.cache.ssl = False
        self.mock_settings.cache.ssl_ca_certs = None

        self.cache_session = CacheSession(app_config)

    def test_initialization(self):
        # Assert
        assert self.cache_session.host == "localhost"
        assert self.cache_session.port == 6379
        assert self.cache_session.password is None
        assert self.cache_session.ssl is False
        assert self.cache_session.ssl_ca_certs is None

    @pytest.mark.asyncio
    async def test_get_cache_creates_redis_instance(self, mocker):
        # Arrange
        redis_mock = mocker.AsyncMock()
        redis_mock.close = mocker.AsyncMock()

        # Mock Redis creation
        redis_from_url_mock = mocker.patch(
            "src.cache.cache_session.Redis", return_value=redis_mock
        )

        # Act
        async with self.cache_session.get_cache() as cache:
            # Assert
            assert cache is redis_mock
            redis_from_url_mock.assert_called_once_with(
                host="localhost",
                port=6379,
                password=None,
                ssl=False,
                ssl_ca_certs=None,
            )

    @pytest.mark.asyncio
    async def test_get_cache_yields_and_closes_connection(self, mocker):
        # Arrange
        redis_mock = mocker.AsyncMock()
        redis_mock.close = mocker.AsyncMock()

        # Mock Redis creation
        mocker.patch("src.cache.cache_session.Redis", return_value=redis_mock)

        # Act
        async with self.cache_session.get_cache() as cache:
            # Verify the yielded value
            assert cache is redis_mock

        # Assert that close was called when exiting the context manager
        redis_mock.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_operations_with_mocked_redis(self, mocker):
        # 创建独立的mock方法并跟踪它们
        mock_get = mocker.AsyncMock(return_value=b"value")
        mock_set = mocker.AsyncMock(return_value=True)
        mock_delete = mocker.AsyncMock(return_value=True)

        # 创建redis_mock并分配mock方法
        redis_mock = mocker.AsyncMock()
        redis_mock.close = mocker.AsyncMock()
        redis_mock.get = mock_get
        redis_mock.set = mock_set
        redis_mock.delete = mock_delete

        # Mock Redis creation
        mocker.patch("src.cache.cache_session.Redis", return_value=redis_mock)

        # Act
        async with self.cache_session.get_cache() as cache:
            # Test get
            result = await cache.get("key")
            assert result == b"value"
            mock_get.assert_called_once_with("key")

            # Test set
            await cache.set("key", "value")
            mock_set.assert_called_once_with("key", "value")

            # Test delete
            await cache.delete("key")
            mock_delete.assert_called_once_with("key")
