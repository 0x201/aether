from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import Theme, get_scalar_api_reference

from src.api import api_router
from src.api.middleware.logging_middleware import LoggingMiddleware
from src.container import AppContainer, create_app_container
from src.core import AppConfig
from src.infrastructure.database.providers import DatabaseManagerProvider
from src.infrastructure.logging.constructor import setup_logging
from src.infrastructure.schedulers import (
    set_container,
    start_scheduled_tasks,
    stop_scheduled_tasks,
)
from src.infrastructure.telemetry.opentelemetry import configure_opentelemetry


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    container: AppContainer = app.state.container
    db_manager: DatabaseManagerProvider = container.db_manager()

    await db_manager.initialize()

    try:
        app_config: AppConfig = container.app_config()

        set_container(container)
        setup_logging(app_config)
        configure_opentelemetry(
            app, app_config, service_name=app_config.otel_service_name
        )

        start_scheduled_tasks()
        logger.info("Application started successfully")

        yield
    finally:
        stop_scheduled_tasks()
        await db_manager.dispose()
        logger.info("Application shutdown successfully")


def create_app() -> FastAPI:
    container = create_app_container()

    app_config = container.app_config()
    app = FastAPI(
        title=app_config.project_name,
        version=app_config.version,
        lifespan=lifespan,
    )

    app.state.container = container

    app.add_middleware(LoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_config.cors or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    return app


app = create_app()

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")


@app.get("/", tags=["System"])
async def root():
    return {"message": "Welcome to Aether Social Analytics Hub API"}


@app.get("/health", tags=["System"])
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


def main() -> None:
    app_config = AppConfig()
    uvicorn.run(
        "src.app:app",
        host=app_config.host,
        port=app_config.port,
        reload=False,
        log_config=None,
    )


if __name__ == "__main__":
    main()
