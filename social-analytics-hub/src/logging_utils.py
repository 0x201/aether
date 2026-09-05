import logging
import sys
from pathlib import Path

from loguru import logger
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

from src.core import AppConfig


class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging(settings: AppConfig) -> None:
    logger.remove()

    if settings.logging.enable_console:
        logger.add(
            sys.stdout,
            format=settings.logging.format,
            level=settings.logging.level,
            colorize=True,
        )

    if settings.logging.enable_file:
        log_dir = Path(settings.logging.dir_path)
        log_dir.mkdir(parents=True, exist_ok=True)

        logger.add(
            log_dir / "app_{time:YYYY-MM-DD}.log",
            format=settings.logging.format,
            level=settings.logging.level,
            rotation=settings.logging.rotation,
            serialize=settings.logging.serialize,
            enqueue=True,
        )

    resource = Resource.create({"service.name": settings.otel_service_name})
    logger_provider = LoggerProvider(resource=resource)

    log_exporter = OTLPLogExporter(endpoint=settings.otel_exporter_otlp_endpoint)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(log_exporter))

    otel_handler = LoggingHandler(level=logging.NOTSET, logger_provider=logger_provider)

    intercept_handler = InterceptHandler()
    logging.root.addHandler(intercept_handler)
    logging.root.addHandler(otel_handler)
    logging.root.setLevel(getattr(logging, settings.logging.level))

    for uvicorn_name in ["uvicorn", "uvicorn.error", "fastapi"]:
        uvicorn_logger = logging.getLogger(uvicorn_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(intercept_handler)
        uvicorn_logger.addHandler(otel_handler)
        uvicorn_logger.propagate = False

    access_logger = logging.getLogger("uvicorn.access")
    access_logger.disabled = True

    logging.getLogger("pika").setLevel(logging.WARNING)
