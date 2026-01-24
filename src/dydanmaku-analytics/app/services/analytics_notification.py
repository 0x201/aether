from typing import Optional
from loguru import logger
from app.common.eventbus import EventBus


class AnalyticsNotification:
    """
    Service for sending analytics completion notifications via the event bus.
    """

    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus

    def notify_analytics_completed(
        self,
        room_id: int,
        start_date: str,
        end_date: str,
        period_type: str,
        frequencies_count: int,
        completed_at: str,
    ):
        """
        Sends an analytics completed notification via the event bus.
        """
        event_data = {
            "RoomId": room_id,
            "StartDate": start_date,
            "EndDate": end_date,
            "PeriodType": period_type,
            "FrequenciesCount": frequencies_count,
            "CompletedAt": completed_at,
        }

        success = self.event_bus.publish(
            "AnalyticsCompletedIntegrationEvent", event_data
        )

        if success:
            logger.info(f"Analytics completed notification sent for room {room_id}")
        else:
            logger.error(
                f"Failed to send analytics completed notification for room {room_id}"
            )

        return success
