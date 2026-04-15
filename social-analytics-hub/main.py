import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import Theme, get_scalar_api_reference

from app.api import api_router
from app.core import settings
from app.deps import Container
from app.logging_utils import setup_logging
from app.schedulers import set_container, start_scheduled_tasks, stop_scheduled_tasks
from telemetry import configure_telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start scheduled analyzer and capture job scheduler on app startup"""
    container = Container()
    container.config.from_dict(settings.model_dump())
    app.container = container  # type: ignore

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
        CORSMiddleware,  # type: ignore[arg-type]
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
    configure_telemetry(app, service_name=settings.otel_service_name)

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_config=None,
    )
