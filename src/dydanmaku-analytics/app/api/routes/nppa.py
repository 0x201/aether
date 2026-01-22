from typing import Optional
from fastapi import APIRouter, Query

from .timed_route import TimedRoute
from app.dataclass.common import PagedResult

from app.deps import (
    NPPARepositoryDep,
)

router = APIRouter(route_class=TimedRoute)


@router.get(
    "/",
    tags=["NPPA Game Audits"],
    description="Get NPPA game audits with pagination and filtering",
    summary="Get NPPA game audits with pagination and filtering",
)
async def get_nppa_game_audits(
    nppa_repo: NPPARepositoryDep,
    page: int = Query(1, description="Current page number"),
    page_size: int = Query(10, description="Number of items per page"),
    name: Optional[str] = Query(None, description="Filter by name"),
    start_time: str = Query(
        ..., description="Start time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    end_time: str = Query(
        ..., description="End time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
):
    game_audits, total_cout = nppa_repo.get_paged_network_game_audits(page, page_size, name, start_time, end_time)
    return PagedResult(data=game_audits, total_count=total_cout)
