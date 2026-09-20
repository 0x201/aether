import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from inspect import isawaitable

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import Theme, get_scalar_api_reference

from container import create_app_conatiner
from src.api import api_router
from src.container import AppContainer
from src.core import AppConfig
from src.logging_utils import setup_logging
from src.middleware.logging_middleware import LoggingMiddleware
from src.schedulers import set_container, start_scheduled_tasks, stop_scheduled_tasks
from src.telemetry import configure_telemetry


async def maybe_await(value: object) -> None:
    if isawaitable(value):
        await value


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    container: AppContainer = app.state.container

    await maybe_await(container.init_resources())

    try:
        app_config: AppConfig = container.app_config()

        set_container(container)
        setup_logging(app_config)
        configure_telemetry(app, app_config, service_name=app_config.otel_service_name)

        start_scheduled_tasks()
        logger.info("Application started successfully")

        yield
    finally:
        stop_scheduled_tasks()
        await maybe_await(container.shutdown_resources())
        logger.info("Application shutdown successfully")


def create_app() -> FastAPI:
    container = create_app_conatiner()

    app_config = container.app_config()
    app = FastAPI(
        title=app_config.project_name, version=app_config.version, lifespan=lifespan
    )

    app.state.container = container

    app.add_middleware(LoggingMiddleware)
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
    app_config = AppConfig()
    uvicorn.run(
        "main:app",
        host=app_config.host,
        port=app_config.port,
        reload=False,
        log_config=None,
    )
