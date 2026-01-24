import json
import logging
import pika
from pika.exceptions import AMQPConnectionError
from app.core.config import settings
from app.dataclass import DanmakuAnalysisDto

logger = logging.getLogger(__name__)


class RabbitMQPublisher:
    """
    RabbitMQ Publisher for sending analytics completion notifications
    """

    def __init__(self):
        self.connection_params = pika.ConnectionParameters(
            host=settings.messaging.host,
            port=settings.messaging.port,
            virtual_host="/",
            credentials=pika.PlainCredentials(
                username=settings.messaging.username,
                password=settings.messaging.password,
            ),
        )
        self.exchange_name = "mc_event_bus"
        self.connection = None
        self.channel = None

    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(self.connection_params)
            self.channel = self.connection.channel()

            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name, exchange_type="direct", durable=True
            )

            logger.info("Successfully connected to RabbitMQ")
            return True
        except AMQPConnectionError as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            return False

    def disconnect(self):
        """Close RabbitMQ connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("RabbitMQ connection closed")

    def send_analytics_completed_event(
        self,
        danmaku_analysis: DanmakuAnalysisDto,
    ):
        """
        Send analytics completed event to RabbitMQ
        """
        if not self.channel:
            if not self.connect():
                logger.error("Cannot send message: RabbitMQ connection failed")
                return False

        if not self.channel:
            logger.error("Cannot send message: RabbitMQ channel is not available")
            return False

        routing_key = "AnalyticsCompletedIntegrationEvent"

        event_data = {
            "roomId": danmaku_analysis.roomId,
            "startDate": danmaku_analysis.startDate.isoformat(),
            "endDate": danmaku_analysis.endDate.isoformat(),
            "periodType": danmaku_analysis.periodType,
            "frequenciesCount": danmaku_analysis.frequenciesCount,
            "completedAt": danmaku_analysis.createdAt.isoformat()
        }

        try:
            message_json = json.dumps(event_data, ensure_ascii=False)

            self.channel.basic_publish(
                exchange=self.exchange_name,
                routing_key=routing_key,
                body=message_json,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                ),
            )

            logger.info(
                f"Analytics completed event sent for room {danmaku_analysis.roomId}"
            )
            return True

        except Exception as e:
            logger.error(f"Error publishing analytics completed event: {e}")
            return False


rabbitmq_publisher = RabbitMQPublisher()
