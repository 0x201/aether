from fastapi import APIRouter
from config import config
from .api_v1.api import api_router as api_v1_router


def create_api_router() -> APIRouter:
    api_router = APIRouter()
    api_router.include_router(
        api_v1_router, prefix=f"/{config.api_config.api_version}"
    )

    return api_router
