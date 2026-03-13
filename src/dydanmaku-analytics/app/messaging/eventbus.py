from pika.adapters.blocking_connection import BlockingChannel
from _thread import lock
import json
import threading
from contextlib import contextmanager
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
        self.exchange_name: str = exchange_name
        self._lock: lock = threading.Lock()

    def _create_connection(self):
        try:
            credentials = pika.PlainCredentials(
                username=settings.messaging.rabbitmq_username,
                password=settings.messaging.rabbitmq_password,
            )
            parameters = pika.ConnectionParameters(
                host=settings.messaging.rabbitmq_host,
                port=settings.messaging.rabbitmq_port,
                virtual_host=settings.messaging.virtual_host,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )
            connection = pika.BlockingConnection(parameters)
            channel: BlockingChannel = connection.channel()

            channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type="direct",
                durable=False,
                auto_delete=False,
            )

            logger.info(
                f"Created temporary connection to RabbitMQ, exchange '{self.exchange_name}'"
            )

            return connection, channel
        except Exception as ex:
            logger.error(f"Error creating connection to RabbitMQ: {ex}")
            return None, None

    def publish(self, event_type_name: str, event_data: Dict[str, Any]):
        """
        Publish an integration event to RabbitMQ using context manager.

        Parameters
            event_type_name: event type name
            event_data: event data
            exchange_name: optional exchange name, defaults to instance exchange name

        Return
            bool: True if the message was published successfully, False otherwise.
        """
        with self.get_connection() as conn:
            channel = conn["channel"]

            if not channel:
                logger.error("Cannot publish: no channel available")
                return False

            try:
                body: str = json.dumps(obj=event_data, ensure_ascii=False)
                properties = pika.BasicProperties(
                    delivery_mode=2,
                    headers={"traceparent": f"{event_type_name}"},
                )
                channel.basic_publish(
                    exchange=self.exchange_name,
                    routing_key=event_type_name,
                    body=body,
                    properties=properties,
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
        """Subscribe to an event type using direct connection"""
        connection, channel = self._create_connection()

        if not channel:
            logger.error("Cannot subscribe: no channel available")
            return

        try:
            # Declare a queue for this consumer
            queue_name = f"{event_type_name}_queue"
            channel.queue_declare(queue=queue_name, durable=True)

            # Bind the queue to the exchange with the routing key
            channel.queue_bind(
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

            channel.basic_consume(
                queue=queue_name, on_message_callback=wrapper_callback
            )
            logger.info(f"Subscribed to event '{event_type_name}'")

            logger.info("Starting to consume messages...")
            channel.start_consuming()
        except Exception as ex:
            logger.error(f"Error subscribing to event: {ex}")
        finally:
            if connection and not connection.is_closed:
                try:
                    connection.close()
                    logger.debug("Closed temporary RabbitMQ connection after subscribe")
                except Exception as ex:
                    logger.error(f"Error closing connection: {ex}")

    @contextmanager
    def get_connection(self):
        """Context manager for getting a connection"""
        connection, channel = self._create_connection()
        try:
            yield {"connection": connection, "channel": channel}
        finally:
            if connection and not connection.is_closed:
                try:
                    connection.close()
                    logger.debug(
                        "Closed temporary RabbitMQ connection from context manager"
                    )
                except Exception as ex:
                    logger.error(f"Error closing connection: {ex}")
