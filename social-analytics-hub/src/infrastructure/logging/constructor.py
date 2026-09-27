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


def _add_file_sink(app_config: AppConfig, log_dir: Path) -> None:
    """注册文件 sink。

    `enqueue=True` 需要创建 multiprocessing 管道，在受限运行环境（例如禁止
    命名管道的沙箱或部分容器）中会抛 `OSError`。此时降级为同步写入，
    而不是让整个应用启动失败。
    """
    sink_options = {
        "format": app_config.logging.format,
        "level": app_config.logging.level,
        "rotation": app_config.logging.rotation,
        "serialize": app_config.logging.serialize,
    }
    try:
        logger.add(log_dir / "app_{time:YYYY-MM-DD}.log", enqueue=True, **sink_options)
    except (OSError, PermissionError) as error:
        logger.warning(
            f"Enqueued file logging unavailable ({error}); "
            "falling back to synchronous writing"
        )
        logger.add(log_dir / "app_{time:YYYY-MM-DD}.log", enqueue=False, **sink_options)


def setup_logging(app_config: AppConfig) -> None:
    logger.remove()

    if app_config.logging.enable_console:
        logger.add(
            sys.stdout,
            format=app_config.logging.format,
            level=app_config.logging.level,
            colorize=True,
        )

    if app_config.logging.enable_file:
        log_dir = Path(app_config.logging.dir_path)
        log_dir.mkdir(parents=True, exist_ok=True)
        _add_file_sink(app_config, log_dir)

    resource = Resource.create({"service.name": app_config.otel_service_name})
    logger_provider = LoggerProvider(resource=resource)

    log_exporter = OTLPLogExporter(endpoint=app_config.otel_exporter_otlp_endpoint)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(log_exporter))

    otel_handler = LoggingHandler(level=logging.NOTSET, logger_provider=logger_provider)

    intercept_handler = InterceptHandler()
    logging.root.addHandler(intercept_handler)
    logging.root.addHandler(otel_handler)
    logging.root.setLevel(getattr(logging, app_config.logging.level))

    for uvicorn_name in ["uvicorn", "uvicorn.error", "fastapi"]:
        uvicorn_logger = logging.getLogger(uvicorn_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(intercept_handler)
        uvicorn_logger.addHandler(otel_handler)
        uvicorn_logger.propagate = False

    access_logger = logging.getLogger("uvicorn.access")
    access_logger.disabled = True

    logging.getLogger("pika").setLevel(logging.WARNING)
