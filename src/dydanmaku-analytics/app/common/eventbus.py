from contextlib import contextmanager
import json
from typing import Any, Callable, Dict, Protocol
import pika
from loguru import logger
from app.core.config import settings


class IEventBus(Protocol):
    def publish(self, event_type_name: str, event_data: Dict[str, Any]) -> bool: ...

    def subscribe(
        self, event_type_name: str, callback: Callable[[Dict[str, Any]], None]
    ): ...

    def close(self): ...


class EventBus(IEventBus):
    """
    Event bus for publishing integration events to RabbitMQ.
    """

    def __init__(self, exchange_name: str = "mc_event_bus"):
        self.exchange_name = exchange_name
        self.connection = None
        self.channel = None
        self.exchange_declared = False
        self._connect()

    def _connect(self):
        """Establish connection to RabbitMQ"""
        try:
            # Create connection
            credentials = pika.PlainCredentials(
                settings.messaging.username, settings.messaging.password
            )
            parameters = pika.ConnectionParameters(
                host=settings.messaging.host,
                port=settings.messaging.port,
                virtual_host=settings.messaging.virtual_host,
                credentials=credentials,
            )
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type="direct",
                durable=False,
                auto_delete=False,
            )
            self.exchange_declared = True
            logger.info(
                f"Connected to RabbitMQ, exchange '{self.exchange_name}' declared"
            )
        except Exception as ex:
            logger.error(f"Error connecting to RabbitMQ: {ex}")
            self.connection = None
            self.channel = None

    def _ensure_connection(self):
        if not self.connection or self.connection.is_closed:
            logger.warning("Connection closed, attempting to reconnect...")
            self._connect()
        elif not self.channel or self.channel.is_closed:
            logger.warning("Channel closed, attempting to recreate...")
            self._connect()

    def publish(self, event_type_name: str, event_data: Dict[str, Any]):
        """
        Publish an integration event to RabbitMQ.

        Parameters
            event_type_name: event type name
            event_data: event data
            exchange_name: optional exchange name, defaults to instance exchange name

        Return
            bool: True if the message was published successfully, False otherwise.
        """
        try:
            self._ensure_connection()
            if not self.channel:
                logger.error("Cannot publish: no channel available")
                return False

            body = json.dumps(event_data, ensure_ascii=False)
            self.channel.basic_publish(
                exchange=self.exchange_name,
                routing_key=event_type_name,
                body=body,
                properties=pika.BasicProperties(
                    delivery_mode=2
                ),  # Make message persistent
            )
            logger.info(
                f"Published event '{event_type_name}' to exchange '{self.exchange_name}'"
            )
            return True
        except Exception as ex:
            logger.error(f"Error publishing event: {ex}")
            return False

    def subscribe(
        self, event_type_name: str, callback: Callable[[Dict[str, Any]], None]
    ):
        """Subscribe to an event type"""
        try:
            self._ensure_connection()
            if not self.channel:
                logger.error("Cannot subscribe: no channel available")
                return

            # Declare a queue for this consumer
            queue_name = f"{event_type_name}_queue"
            self.channel.queue_declare(queue=queue_name, durable=True)

            # Bind the queue to the exchange with the routing key
            self.channel.queue_bind(
                exchange=self.exchange_name,
                queue=queue_name,
                routing_key=event_type_name,
            )

            # Set up consumer
            def wrapper_callback(ch, method, properties, body):
                try:
                    data = json.loads(body.decode("utf-8"))
                    callback(data)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

            self.channel.basic_consume(
                queue=queue_name, on_message_callback=wrapper_callback
            )
            logger.info(f"Subscribed to event '{event_type_name}'")
        except Exception as ex:
            logger.error(f"Error subscribing to event: {ex}")

    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("RabbitMQ connection closed")

    @contextmanager
    def get_connection(self):
        """Context manager for getting a connection"""
        try:
            self._ensure_connection()
            yield self
        finally:
            self.close()
            pass

    def start_consuming(self):
        """Start consuming messages (blocking operation)"""
        try:
            if self.channel:
                logger.info("Starting to consume messages...")
                self.channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("Stopping message consumption...")
            self.channel.stop_consuming()
            self.close()
