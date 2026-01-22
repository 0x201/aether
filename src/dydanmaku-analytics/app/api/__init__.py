from .routes import danmaku, nppa
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(danmaku.router, prefix="/danmakus", tags=["danmakus"])
api_router.include_router(nppa.router, prefix="/nppa", tags=["NPPA Game Audits"])
