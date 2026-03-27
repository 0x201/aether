from typing import List, Optional

from dependency_injector.wiring import inject
from fastapi import APIRouter, Query, Body

from app.database import GameAudit, NetworkGameAudit
from app.dataclass import GameAuditDto, NetworkGameAuditDto
from app.dataclass.common import PagedResult
from app.deps import NPPARepositoryDep, NPPAGameAuditCrawlerDep

from .timed_route import TimedRoute

router = APIRouter(route_class=TimedRoute)


@router.post(
    "/trigger-nppa-crawler",
    description="Trigger NPPA crawler manually with specified mode",
    summary="Trigger NPPA crawler manually",
)
@inject
async def trigger_nppa_crawler(
    crawler: NPPAGameAuditCrawlerDep,
    mode: int = Body(0, description="0 for incremental data, 1 for full data", embed=True)
):
    """
    Manually trigger the NPPA crawler to run immediately
    """
    try:
        await crawler.run(mode=mode)
        return {"message": f"NPPA crawler executed successfully with mode {mode}", "success": True}
    except Exception as e:
        return {"message": f"Error executing NPPA crawler: {str(e)}", "success": False}


@router.get(
    "/network-game-audits",
    description="Get NPPA network game audits with pagination and filtering",
    summary="Get NPPA network game audits with pagination and filtering",
)
@inject
async def get_nppa_network_game_audits(
    nppa_repo: NPPARepositoryDep,
    page: int = Query(1, description="Current page number"),
    pageSize: int = Query(10, description="Number of items per page"),
    name: Optional[str] = Query(None, description="Filter by name"),
    startTime: Optional[str] = Query(
        None, description="Start time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    endTime: Optional[str] = Query(
        None, description="End time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
):
    network_game_audits, total_count = nppa_repo.get_paged_network_game_audits(
        page, pageSize, name, startTime, endTime
    )
    return PagedResult(
        data=_map_network_game_audits(network_game_audits), totalCount=total_count
    )


@router.get(
    "/game-audits",
    description="Get NPPA game audits with pagination and filtering",
    summary="Get NPPA game audits with pagination and filtering",
)
@inject
async def get_nppa_game_audits(
    nppa_repo: NPPARepositoryDep,
    page: int = Query(1, description="Current page number"),
    pageSize: int = Query(10, description="Number of items per page"),
    name: Optional[str] = Query(None, description="Filter by name"),
    startTime: Optional[str] = Query(
        None, description="Start time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    endTime: Optional[str] = Query(
        None, description="End time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
):
    game_audits, total_count = nppa_repo.get_paged_game_audits(
        page, pageSize, name, startTime, endTime
    )
    return PagedResult(data=_map_game_audits(game_audits), totalCount=total_count)


def _map_game_audit(audit: GameAudit) -> GameAuditDto:
    return GameAuditDto(
        id=audit.id,
        title=audit.title,
        url=audit.url,
        publishDate=audit.publish_date,
    )


def _map_game_audits(audits: List[GameAudit]) -> List[GameAuditDto]:
    return [_map_game_audit(audit) for audit in audits]


def _map_network_game_audit(audit: NetworkGameAudit) -> NetworkGameAuditDto:
    return NetworkGameAuditDto(
        id=audit.id,
        name=audit.name,
        auditCategory=audit.audit_category,
        operator=audit.operator,
        isbn=audit.isbn,
        publisher=audit.publisher,
        publishDate=audit.publish_date,
        category=str(audit.category),
        auditNo=audit.audit_no,
    )


def _map_network_game_audits(
    audits: List[NetworkGameAudit],
) -> List[NetworkGameAuditDto]:
    return [_map_network_game_audit(audit) for audit in audits]