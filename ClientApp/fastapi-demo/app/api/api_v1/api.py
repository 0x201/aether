# coding=utf-8

from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    books,
    login,
    users,
    utils,
    authors,
    nppa_game_audits,
)

api_router = APIRouter()
#api_router.prefix = "v1"
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(authors.router, prefix="/authors", tags=["authors"])
api_router.include_router(
    nppa_game_audits.router, prefix="/nppa-game-audits", tags=["NPPA"]
)
