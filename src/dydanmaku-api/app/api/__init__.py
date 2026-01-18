from app.api.routes import danmaku
from fastapi import APIRouter


api_router = APIRouter()
api_router.include_router(danmaku.router, prefix="/danmakus", tags=["danmakus"])
