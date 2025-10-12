# coding=utf-8

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src import crud, schemas
from src.api import deps
from src.schemas.paged_result import PagedResult

router = APIRouter()


@router.get("/game-audits", response_model=PagedResult[schemas.GameAudit], 
    summary="Get game audits",
    description="Retrieve a paginated list of game audits with optional title filtering")
async def read_game_audits(
        *,
        db: Session = Depends(deps.get_db),
        title: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
):
    return crud.game_audit.get_paged_audits(db, title=title, skip=skip, limit=limit)


@router.get("/game-audits/{audit_id}", response_model=schemas.GameAudit,
    summary="Get game audit by ID",
    description="Retrieve a specific game audit by its ID")
async def get_audit(*, db: Session = Depends(deps.get_db), audit_id: int):
    return crud.game_audit.get(db, audit_id)


@router.get("/network-games", response_model=PagedResult[schemas.NetworkGameAudit],
    summary="Get network game audits",
    description="Retrieve a paginated list of network game audits with optional query filtering")
async def read_network_game_audits(
        *,
        db: Session = Depends(deps.get_db),
        query_str: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
):
    return crud.network_game_audit.get_paged_network_games_audits(
        db, query_str=query_str, skip=skip, limit=limit
    )


@router.get(
    "/network-games/category-top-10",
    response_model=schemas.Chart,
    summary="Get top 10 categories",
    description="Retrieve top 10 game categories by audit count"
)
async def read_network_game_audit_category_top_10(
        *, db: Session = Depends(deps.get_db), category: Optional[int] = None
):
    return crud.network_game_audit.get_audit_category_top_10(db, category=category)


@router.get(
    "/network-games/publisher-top-10",
    response_model=schemas.Chart,
    summary="Get top 10 publishers",
    description="Retrieve top 10 game publishers by audit count"
)
async def read_network_game_audit_publisher_top_10(
        *, db: Session = Depends(deps.get_db), category: Optional[int] = None
):
    return crud.network_game_audit.get_publisher_top_10(db, category=category)


@router.get(
    "/network-games/audits-per-year",
    response_model=schemas.Chart,
    summary="Get audits per year",
    description="Retrieve game audit counts grouped by year"
)
async def read_network_game_audit_publisher_top_10(*, db: Session = Depends(deps.get_db)):
    return crud.network_game_audit.get_audits_per_year(db)