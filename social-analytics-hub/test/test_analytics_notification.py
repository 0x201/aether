import pytest

from src.services.analytics_notification import AnalyticsNotification


class TestAnalyticsNotification:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        """Setup mocks automatically for all tests in this class"""
        self.event_bus_mock = mocker.Mock()
        self.notifier = AnalyticsNotification(event_bus=self.event_bus_mock)

    def test_initialization(self, mocker):
        # Arrange & Act
        event_bus_mock = mocker.Mock()
        notifier = AnalyticsNotification(event_bus=event_bus_mock)

        # Assert
        assert notifier.event_bus == event_bus_mock

    def test_send_notification_success(self, mocker):
        # Arrange
        event_bus_mock = mocker.Mock()
        event_bus_mock.publish = mocker.Mock(return_value=True)
        notifier = AnalyticsNotification(event_bus=event_bus_mock)

        # Act
        result = notifier.notify_analytics_completed(
            room_id=123,
            start_date="2023-01-01T00:00:00",
            end_date="2023-01-02T00:00:00",
            period_type="daily",
            frequencies_count=10,
            completed_at="2023-01-02T10:00:00",
        )

        # Assert
        event_bus_mock.publish.assert_called_once()
        assert result is True

    def test_send_notification_failure(self, mocker):
        # Arrange
        event_bus_mock = mocker.Mock()
        event_bus_mock.publish = mocker.Mock(return_value=False)
        notifier = AnalyticsNotification(event_bus=event_bus_mock)

        # Act
        result = notifier.notify_analytics_completed(
            room_id=123,
            start_date="2023-01-01T00:00:00",
            end_date="2023-01-02T00:00:00",
            period_type="daily",
            frequencies_count=10,
            completed_at="2023-01-02T10:00:00",
        )

        # Assert
        event_bus_mock.publish.assert_called_once()
        assert result is False

    def test_notify_with_none_room_id(self, mocker):
        # Arrange
        event_bus_mock = mocker.Mock()
        event_bus_mock.publish = mocker.Mock(return_value=True)
        notifier = AnalyticsNotification(event_bus=event_bus_mock)

        # Act
        result = notifier.notify_analytics_completed(
            room_id=None,
            start_date="2023-01-01T00:00:00",
            end_date="2023-01-02T00:00:00",
            period_type="daily",
            frequencies_count=5,
            completed_at="2023-01-02T10:00:00",
        )

        # Assert
        event_bus_mock.publish.assert_called_once()
        assert result is True

    def test_notify_with_different_period_types(self, mocker):
        # Arrange
        event_bus_mock = mocker.Mock()
        event_bus_mock.publish = mocker.Mock(return_value=True)
        notifier = AnalyticsNotification(event_bus=event_bus_mock)

        # Act
        result = notifier.notify_analytics_completed(
            room_id=456,
            start_date="2023-02-01T00:00:00",
            end_date="2023-02-02T00:00:00",
            period_type="hourly",
            frequencies_count=20,
            completed_at="2023-02-02T10:00:00",
        )

        # Assert
        event_bus_mock.publish.assert_called_once()
        assert result is True

    def test_notify_with_zero_frequencies(self, mocker):
        # Arrange
        event_bus_mock = mocker.Mock()
        event_bus_mock.publish = mocker.Mock(return_value=True)
        notifier = AnalyticsNotification(event_bus=event_bus_mock)

        # Act
        result = notifier.notify_analytics_completed(
            room_id=789,
            start_date="2023-03-01T00:00:00",
            end_date="2023-03-02T00:00:00",
            period_type="weekly",
            frequencies_count=0,
            completed_at="2023-03-02T10:00:00",
        )

        # Assert
        event_bus_mock.publish.assert_called_once()
        assert result is True
