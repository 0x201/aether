from fastapi import APIRouter

from .routers import danmaku

api_router = APIRouter()
api_router.include_router(danmaku.router, prefix="/danmakus", tags=["Danmakus"])
