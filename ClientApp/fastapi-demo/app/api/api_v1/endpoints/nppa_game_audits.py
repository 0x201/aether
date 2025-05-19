# coding=utf-8

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps

router = APIRouter()


@router.get("/game-audits", response_model=schemas.PagedResult)
async def read_game_audits(
        *,
        db: Session = Depends(deps.get_db),
        title: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
):
    return crud.game_audit.get_paged_audits(db, title=title, skip=skip, limit=limit)


@router.get("/game-audits/{audit_id}", response_model=schemas.GameAudit)
async def get_audit(*, db: Session = Depends(deps.get_db), audit_id: int):
    return crud.game_audit.get(db, audit_id)


@router.get("/network-games", response_model=schemas.PagedResult)
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
)
async def read_network_game_audit_category_top_10(
        *, db: Session = Depends(deps.get_db), category: Optional[int] = None
):
    return crud.network_game_audit.get_audit_category_top_10(db, category=category)


@router.get(
    "/network-games/publisher-top-10",
    response_model=schemas.Chart,
)
async def read_network_game_audit_publisher_top_10(
        *, db: Session = Depends(deps.get_db), category: Optional[int] = None
):
    return crud.network_game_audit.get_publisher_top_10(db, category=category)


@router.get(
    "/network-games/audits-per-year",
    response_model=schemas.Chart,
)
async def read_network_game_audit_publisher_top_10(*, db: Session = Depends(deps.get_db)):
    return crud.network_game_audit.get_audits_per_year(db)
