import json
import pika
from loguru import logger
from pika.exceptions import AMQPConnectionError
from app.core.config import settings


class EventBus:
    """
    Event bus for publishing integration events to RabbitMQ.
    """

    def __init__(self, exchange_name=None):
        self.connection_params = pika.ConnectionParameters(
            host=settings.messaging.host,
            port=settings.messaging.port,
            virtual_host="/",
            credentials=pika.PlainCredentials(
                username=settings.messaging.username,
                password=settings.messaging.password,
            ),
        )
        self.exchange_name = exchange_name or "mc_event_bus"
        self.connection = None
        self.channel = None
        self._connected = False

    def _ensure_connection(self, exchange_name=None):
        exchange_to_use = exchange_name or self.exchange_name

        if not self._connected or not self.connection or self.connection.is_closed:
            try:
                self.connection = pika.BlockingConnection(self.connection_params)
                self.channel = self.connection.channel()
                self.channel.exchange_declare(
                    exchange=exchange_to_use, exchange_type="direct"
                )
                self._connected = True
                logger.info(
                    f"Successfully connected to RabbitMQ, exchange: {exchange_to_use}"
                )
                return True
            except AMQPConnectionError as e:
                logger.error(f"Failed to connect to RabbitMQ: {e}")
                self._connected = False
                return False
            except Exception as e:
                logger.error(f"Unexpected error connecting to RabbitMQ: {e}")
                self._connected = False
                return False
        else:
            if self.channel and not self.channel.is_open:
                try:
                    self.channel = self.connection.channel()
                    self.channel.exchange_declare(
                        exchange=exchange_to_use, exchange_type="direct"
                    )
                    logger.info("Recreated channel for RabbitMQ connection")
                except Exception as e:
                    logger.error(f"Error recreating channel: {e}")
                    self._connected = False
                    return False

            return True

    def publish(self, event_type_name: str, event_data: dict, exchange_name=None):
        """
        Publish an integration event to RabbitMQ.

        Parameters
            event_type_name: event type name
            event_data: event data
            exchange_name: optional exchange name, defaults to instance exchange name

        Return
            bool: True if the message was published successfully, False otherwise.
        """
        exchange_to_use = exchange_name or self.exchange_name

        if not self._ensure_connection(exchange_to_use):
            logger.error("Cannot send message: RabbitMQ connection failed")
            return False

        routing_key = event_type_name

        try:
            message_json = json.dumps(event_data, ensure_ascii=False)

            self.channel.basic_publish(  # type: ignore
                exchange=exchange_to_use,
                routing_key=routing_key,
                body=message_json,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                ),
            )

            logger.info(
                f"Integration event '{event_type_name}' published successfully to exchange '{exchange_to_use}'"
            )
            return True

        except Exception as e:
            logger.error(f"Error publishing integration event '{event_type_name}': {e}")
            self._connected = False
            return False

    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            self._connected = False
            logger.info("RabbitMQ connection closed")
