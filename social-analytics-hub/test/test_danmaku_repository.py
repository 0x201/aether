import pytest
from datetime import datetime, timezone
from app.database.danmaku_repository import DanmakuRepository
from app.dataclass.danmaku_model import CaptureJobStatus


class TestDanmakuRepository:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        """Setup mocks automatically for all tests in this class"""
        self.session_factory_mock = mocker.Mock()
        self.repository = DanmakuRepository(self.session_factory_mock)

    def test_insert_danmaku_success(self, mocker):
        # Arrange
        transaction_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        transaction_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        transaction_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_transaction.return_value = transaction_mock

        # Act
        result = self.repository.insert_danmaku(
            user_id="123",
            user_name="test_user",
            content="Hello world!",
            fan_medal_name="Medal",
            fan_medal_level=5,
            user_level=10,
            room_id=100,
        )

        # Assert
        assert result is True
        enter_mock.add.assert_called_once()
        # Check the arguments passed to add
        danmaku_arg = enter_mock.add.call_args[0][0]
        assert danmaku_arg.user_id == "123"
        assert danmaku_arg.user_name == "test_user"
        assert danmaku_arg.content == "Hello world!"
        assert danmaku_arg.fan_medal_name == "Medal"
        assert danmaku_arg.fan_medal_level == 5
        assert danmaku_arg.user_level == 10
        assert danmaku_arg.room_id == 100

    def test_get_danmaku_count_success(self, mocker):
        # Arrange
        session_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        session_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        session_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_session.return_value = session_mock
        enter_mock.execute.return_value.scalar.return_value = 42

        # Act
        result = self.repository.get_danmaku_count()

        # Assert
        assert result == 42
        enter_mock.execute.assert_called_once()

    def test_get_danmaku_count_error(self, mocker):
        # Arrange
        session_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        session_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        session_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_session.return_value = session_mock
        enter_mock.execute.side_effect = Exception("DB Error")

        # Act & Assert (should catch the exception internally and return 0)
        result = self.repository.get_danmaku_count()
        assert result == 0

    def test_get_recent_danmaku_success(self, mocker):
        # Arrange
        session_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        session_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        session_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_session.return_value = session_mock
        mock_danmaku = mocker.Mock()
        enter_mock.execute.return_value.scalars.return_value.all.return_value = [
            mock_danmaku
        ]

        # Act
        result = self.repository.get_recent_danmaku(limit=10)

        # Assert
        assert result == [mock_danmaku]
        enter_mock.execute.assert_called_once()

    def test_get_recent_danmaku_error(self, mocker):
        # Arrange
        session_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        session_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        session_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_session.return_value = session_mock
        enter_mock.execute.side_effect = Exception("DB Error")

        # Act & Assert (should catch the exception internally and return [])
        result = self.repository.get_recent_danmaku(limit=10)
        assert result == []

    def test_create_capture_job_success(self, mocker):
        # Arrange
        transaction_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        transaction_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        transaction_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_transaction.return_value = transaction_mock
        enter_mock.refresh = mocker.Mock()
        enter_mock.commit = mocker.Mock()

        # Mock the CaptureJob creation
        capture_job_class_mock = mocker.patch(
            "app.database.danmaku_repository.CaptureJob"
        )
        mock_job = mocker.Mock()
        capture_job_class_mock.return_value = mock_job

        # Act
        result = self.repository.create_capture_job(
            room_id=100, url="http://example.com", duration=300
        )

        # Assert
        assert result == mock_job
        enter_mock.add.assert_called_once_with(mock_job)
        enter_mock.commit.assert_called_once()
        capture_job_class_mock.assert_called_once()

    def test_update_capture_job_status_success(self, mocker):
        # Arrange
        transaction_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        transaction_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        transaction_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_transaction.return_value = transaction_mock
        enter_mock.execute.return_value.fetchall.return_value = [mocker.Mock()]
        enter_mock.commit = mocker.Mock()

        # Act
        result = self.repository.update_capture_job_status(
            job_id=123,
            status=CaptureJobStatus.COMPLETED.value,
            end_time=datetime.now(timezone.utc),
        )

        # Assert
        assert result is True
        enter_mock.execute.assert_called_once()
        enter_mock.commit.assert_called_once()

    def test_update_capture_job_status_not_found(self, mocker):
        # Arrange
        transaction_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        transaction_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        transaction_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_transaction.return_value = transaction_mock
        enter_mock.execute.return_value.fetchall.return_value = []
        enter_mock.commit = mocker.Mock()

        # Act
        result = self.repository.update_capture_job_status(
            job_id=999, status=CaptureJobStatus.COMPLETED.value
        )

        # Assert
        assert result is False
        enter_mock.execute.assert_called_once()
        enter_mock.commit.assert_called_once()

    def test_get_running_capture_job_success(self, mocker):
        # Arrange
        session_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        session_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        session_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_session.return_value = session_mock
        mock_job = mocker.Mock()
        enter_mock.execute.return_value.scalar_one_or_none.return_value = mock_job

        # Act
        result = self.repository.get_running_capture_job(room_id=100)

        # Assert
        assert result == mock_job
        enter_mock.execute.assert_called_once()

    def test_get_running_capture_job_error(self, mocker):
        # Arrange
        session_mock = mocker.Mock()
        enter_mock = mocker.Mock()
        session_mock.__enter__ = mocker.Mock(return_value=enter_mock)
        session_mock.__exit__ = mocker.Mock(return_value=None)
        self.session_factory_mock.get_session.return_value = session_mock
        enter_mock.execute.side_effect = Exception("DB Error")

        # Act & Assert (should catch the exception internally and return None)
        result = self.repository.get_running_capture_job(room_id=100)
        assert result is None
