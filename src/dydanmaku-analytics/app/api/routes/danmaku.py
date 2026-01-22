from datetime import datetime, timezone
from typing import Optional

from app.deps import (
    DanmakuAnalyzerDep,
    SessionDep,
)
from fastapi import APIRouter, HTTPException, Query

from .timed_route import TimedRoute

router = APIRouter(route_class=TimedRoute)


def convert_to_utc(dt_str: str) -> datetime:
    """Convert a datetime string to UTC timezone"""
    # Handle 'Z' suffix for UTC time
    if dt_str.endswith("Z"):
        dt_str = dt_str.replace("Z", "+00:00")

    dt = datetime.fromisoformat(dt_str)

    # If datetime is naive (no timezone), assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    # Ensure it's in UTC
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt


@router.post(
    "/analysis/generate",
    tags=["Analysis"],
    description="Generate danmaku analysis for a specified time range",
    summary="Generate danmaku analysis for a specified time range",
)
async def generate_analysis(
    session: SessionDep,
    analyzer: DanmakuAnalyzerDep,
    start_time: str = Query(
        ..., description="Start time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    end_time: str = Query(
        ..., description="End time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    room_id: Optional[int] = Query(None, description="Filter by room ID"),
):
    if not start_time or not end_time:
        raise HTTPException(
            status_code=400,
            detail="Both start_time and end_time are required for fetching precomputed data",
        )

    try:
        start_dt = convert_to_utc(start_time)
        end_dt = convert_to_utc(end_time)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

    _ = analyzer.generate_analysis(
        top_n=100,
        session=session,
        start_time=start_dt,
        end_time=end_dt,
        room_id=room_id,
    )

    return {"message": "Analysis generated"}
