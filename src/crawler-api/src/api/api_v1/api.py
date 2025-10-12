from fastapi import APIRouter
from .endpoints import (
    authors,
    books,
    nppa_game_audits,
    users
)

api_router = APIRouter()

api_router.include_router(authors.router, prefix="/authors", tags=["Authors"])
api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(nppa_game_audits.router, prefix="/nppa", tags=["NPPA Game Audits"])
api_router.include_router(users.router, tags=["Users"])
