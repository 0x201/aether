import os
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import get_scalar_api_reference, Theme

from app.api import api_router
from app.core.config import settings
from app.schedulers import start_scheduled_tasks, stop_scheduled_tasks, set_container
from app.deps import Container


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


def setup_logging():
    # Remove default logger configuration
    logger.remove()

    # Add console handler if console logging is enabled
    if settings.logging.enable_console:
        logger.add(
            sys.stdout,
            format=settings.logging.format,
            level=settings.logging.level,
            colorize=True,
        )

    # Add file handler if file logging is enabled
    if settings.logging.enable_file:
        # Ensure log directory exists
        log_dir = Path(settings.logging.dir_path)
        log_dir.mkdir(parents=True, exist_ok=True)

        logger.add(
            log_dir / "app_{time:YYYY-MM-DD}.log",
            format=settings.logging.format,
            level=settings.logging.level,
            rotation=settings.logging.rotation,
            serialize=settings.logging.serialize,
            enqueue=True,  # Multiprocess safe
        )

    intercept_handler = InterceptHandler()
    logging.root.handlers = [intercept_handler]
    logging.root.setLevel(getattr(logging, settings.logging.level))

    for uvicorn_name in ["uvicorn", "uvicorn.error", "fastapi"]:
        uvicorn_logger = logging.getLogger(uvicorn_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.handlers = [intercept_handler]
        uvicorn_logger.propagate = False

    access_logger = logging.getLogger("uvicorn.access")
    access_logger.disabled = True

    logging.getLogger("pika").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start scheduled analyzer and capture job scheduler on app startup"""
    container = Container()
    container.config.from_dict(settings.model_dump())
    app.container = container

    set_container(container)

    start_scheduled_tasks()
    logger.info("Application started successfully")
    yield

    """Stop schedulers and terminate all capture jobs on app shutdown"""
    stop_scheduled_tasks()

    if hasattr(app.state, "container"):
        event_bus = app.state.container.event_bus()
        event_bus.close()

    logger.info("Application shutdown successfully")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name, version=settings.version, lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    return app


app = create_app()


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Douyu Danmaku Analytics API"}


ENVIRONMENT = os.getenv("ENVIRONMENT", "local")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": ENVIRONMENT}


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
        hide_client_button=True,
        show_developer_tools="never",
        theme=Theme.KEPLER,
    )


if __name__ == "__main__":
    setup_logging()

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_config=None,
    )
