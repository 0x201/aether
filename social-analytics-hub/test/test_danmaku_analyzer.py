from datetime import datetime

import pytest

from src.services.analyze_danmaku import DanmakuAnalyzer


class TestDanmakuAnalyzer:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        """Setup mocks automatically for all tests in this class"""
        self.session_factory_mock = mocker.Mock()
        self.notifier_mock = mocker.Mock()

        # Create a mock cache session
        self.cache_session_mock = mocker.Mock()

        # Create an async context manager for the cache
        cache_context_mock = mocker.MagicMock()
        cache_mock = mocker.AsyncMock()
        cache_context_mock.__aenter__ = mocker.AsyncMock(return_value=cache_mock)
        cache_context_mock.__aexit__ = mocker.AsyncMock(return_value=None)

        # Assign the context manager to the mock
        self.cache_session_mock.get_cache = mocker.Mock(return_value=cache_context_mock)

        self.analyzer = DanmakuAnalyzer(
            session_factory=self.session_factory_mock,
            notifier=self.notifier_mock,
            cache_session=self.cache_session_mock,
        )

    def test_generate_cache_key(self):
        # Act
        key = DanmakuAnalyzer._generate_cache_key(
            "danmaku_analysis",
            datetime(2023, 1, 1, 12, 0, 0),
            datetime(2023, 1, 1, 13, 0, 0),
            123,
        )

        # Assert
        expected = "danmaku_analysis:2023_01_01_12_00_00:2023_01_01_13_00_00:123"
        assert key == expected

    def test_generate_cache_key_with_none_room(self):
        # Act
        key = DanmakuAnalyzer._generate_cache_key(
            "danmaku_analysis",
            datetime(2023, 1, 1, 12, 0, 0),
            datetime(2023, 1, 1, 13, 0, 0),
            None,
        )

        # Assert
        expected = "danmaku_analysis:2023_01_01_12_00_00:2023_01_01_13_00_00:All"
        assert key == expected

    def test_validate_inputs_valid(self):
        # Act & Assert (should not raise any exceptions)
        try:
            self.analyzer._validate_inputs(
                top_n=10,
                start_time=datetime(2023, 1, 1),
                end_time=datetime(2023, 1, 2),
                room_id=123,
            )
        except ValueError:
            pytest.fail("Should not raise ValueError for valid inputs")

    def test_validate_inputs_invalid_top_n(self):
        # Act & Assert
        with pytest.raises(ValueError, match="top_n must be a positive integer"):
            self.analyzer._validate_inputs(
                top_n=0,
                start_time=datetime(2023, 1, 1),
                end_time=datetime(2023, 1, 2),
                room_id=123,
            )

    def test_validate_inputs_start_after_end(self):
        # Act & Assert
        with pytest.raises(ValueError, match="start_time must be before end_time"):
            self.analyzer._validate_inputs(
                top_n=10,
                start_time=datetime(2023, 1, 2),
                end_time=datetime(2023, 1, 1),
                room_id=123,
            )

    def test_build_sql_statements_without_room(self):
        # Act
        danmaku_stmt, analysis_stmt = self.analyzer._build_sql_statements(
            datetime(2023, 1, 1), datetime(2023, 1, 2), None
        )

        # Assert
        # Just check that statements are created (we can't easily compare SQL statements)
        assert danmaku_stmt is not None
        assert analysis_stmt is not None

    def test_build_sql_statements_with_room(self):
        # Act
        danmaku_stmt, analysis_stmt = self.analyzer._build_sql_statements(
            datetime(2023, 1, 1), datetime(2023, 1, 2), 123
        )

        # Assert
        assert danmaku_stmt is not None
        assert analysis_stmt is not None

    @pytest.mark.asyncio
    async def test_check_cache_exists_true(self, mocker):
        # Arrange
        mock_get = mocker.AsyncMock(return_value='{"frequencies": []}')

        cache_mock = mocker.AsyncMock()
        cache_mock.get = mock_get

        # Create an async context manager
        cache_context_mock = mocker.MagicMock()
        cache_context_mock.__aenter__ = mocker.AsyncMock(return_value=cache_mock)
        cache_context_mock.__aexit__ = mocker.AsyncMock(return_value=None)

        # Update the get_cache mock to return our new context manager
        self.cache_session_mock.get_cache = mocker.Mock(return_value=cache_context_mock)

        # Act
        result = await self.analyzer._check_cache_exists("test_key")

        # Assert
        assert result is True
        mock_get.assert_called_once_with("test_key")

    @pytest.mark.asyncio
    async def test_check_cache_exists_false(self, mocker):
        # Arrange
        mock_get = mocker.AsyncMock(return_value=None)

        cache_mock = mocker.AsyncMock()
        cache_mock.get = mock_get

        # Create an async context manager
        cache_context_mock = mocker.MagicMock()
        cache_context_mock.__aenter__ = mocker.AsyncMock(return_value=cache_mock)
        cache_context_mock.__aexit__ = mocker.AsyncMock(return_value=None)

        # Update the get_cache mock to return our new context manager
        self.cache_session_mock.get_cache = mocker.Mock(return_value=cache_context_mock)

        # Act
        result = await self.analyzer._check_cache_exists("test_key")

        # Assert
        assert result is False

    @pytest.mark.asyncio
    async def test_generate_analysis_cached(self, mocker):
        # Arrange
        mock_get = mocker.AsyncMock(return_value='{"frequencies": []}')

        cache_mock = mocker.AsyncMock()
        cache_mock.get = mock_get

        # Create an async context manager
        cache_context_mock = mocker.MagicMock()
        cache_context_mock.__aenter__ = mocker.AsyncMock(return_value=cache_mock)
        cache_context_mock.__aexit__ = mocker.AsyncMock(return_value=None)

        # Update the get_cache mock to return our new context manager
        self.cache_session_mock.get_cache = mocker.Mock(return_value=cache_context_mock)

        # Act
        await self.analyzer.generate_analysis(
            start_time=datetime(2023, 1, 1), end_time=datetime(2023, 1, 2), top_n=10
        )

        # Assert
        # Should return early due to cache hit, without touching DB
        self.session_factory_mock.get_transaction.assert_not_called()
        # The actual cache key depends on the generate_cache_key method
        expected_key = DanmakuAnalyzer._generate_cache_key(
            "danmaku_analysis", datetime(2023, 1, 1), datetime(2023, 1, 2), None
        )
        mock_get.assert_called_once_with(expected_key)

    @pytest.mark.asyncio
    async def test_generate_analysis_no_cache_hit(self, mocker):
        # Arrange
        mock_get = mocker.AsyncMock(return_value=None)

        cache_mock = mocker.AsyncMock()
        cache_mock.get = mock_get

        # Create an async context manager
        cache_context_mock = mocker.MagicMock()
        cache_context_mock.__aenter__ = mocker.AsyncMock(return_value=cache_mock)
        cache_context_mock.__aexit__ = mocker.AsyncMock(return_value=None)

        # Update the get_cache mock to return our new context manager
        self.cache_session_mock.get_cache = mocker.Mock(return_value=cache_context_mock)

        transaction_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        transaction_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        transaction_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_transaction.return_value = transaction_mock
        enter_mock.execute.return_value.scalar_one_or_none.return_value = None
        enter_mock.execute.return_value.fetchmany.return_value = []

        # Mock the private methods
        mocker.patch.object(
            self.analyzer, "_fetch_danmaku_content", return_value="test content"
        )
        calc_mock = mocker.patch.object(self.analyzer, "_calculate_core")
        set_cache_mock = mocker.patch.object(self.analyzer, "_set_analysis_cache")

        calc_return_value = mocker.Mock()
        calc_return_value.room_id = 123
        calc_return_value.start_time = datetime(2023, 1, 1)
        calc_return_value.end_time = datetime(2023, 1, 2)
        calc_return_value.frequencies = []
        calc_return_value.created_at = datetime(2023, 1, 1)
        calc_mock.return_value = calc_return_value

        # Act
        await self.analyzer.generate_analysis(
            start_time=datetime(2023, 1, 1), end_time=datetime(2023, 1, 2), top_n=10
        )

        # Assert
        calc_mock.assert_called_once()
        set_cache_mock.assert_called_once()
        enter_mock.add.assert_called_once()
        enter_mock.commit.assert_called_once()
        # The actual cache key depends on the generate_cache_key method
        expected_key = DanmakuAnalyzer._generate_cache_key(
            "danmaku_analysis", datetime(2023, 1, 1), datetime(2023, 1, 2), None
        )
        mock_get.assert_called_once_with(expected_key)
