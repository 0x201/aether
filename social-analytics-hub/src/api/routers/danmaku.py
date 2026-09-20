from datetime import UTC, datetime

from dependency_injector.wiring import inject
from fastapi import APIRouter, Body, HTTPException

from src.api.dependencies import DanmakuAnalyzerDep
from src.schemas import PeriodType

router = APIRouter()


def convert_to_utc(dt_str: str) -> datetime:
    """Convert a datetime string to UTC timezone"""
    # Handle 'Z' suffix for UTC time
    if dt_str.endswith("Z"):
        dt_str = dt_str.replace("Z", "+00:00")

    dt = datetime.fromisoformat(dt_str)

    # If datetime is naive (no timezone), assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)

    # Ensure it's in UTC
    utc_dt = dt.astimezone(UTC)
    return utc_dt


@router.post(
    "/analysis/generate",
    description="Generate danmaku analysis for a specified time range",
    summary="Generate danmaku analysis for a specified time range",
)
@inject
async def generate_analysis(
    analyzer: DanmakuAnalyzerDep,
    start_time: str = Body(
        ..., description="Start time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    end_time: str = Body(
        ..., description="End time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    ),
    room_id: int | None = Body(None, description="Filter by room ID"),
):
    if not start_time or not end_time:
        raise HTTPException(
            status_code=400,
            detail=(
                "Both start_time and end_time are required for fetching precomputed data"
            ),
        )
    try:
        start_dt = convert_to_utc(start_time)
        end_dt = convert_to_utc(end_time)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

    try:
        if room_id:
            await analyzer.precompute_analyses(
                period_type=PeriodType.HOURLY,
                start_time=start_dt,
                end_time=end_dt,
                room_id=room_id,
            )
        else:
            await analyzer.precompute_for_all_rooms(
                period_type=PeriodType.HOURLY,
                start_time=start_dt,
                end_time=end_dt,
            )

        return {"message": "Analysis generated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during analysis: {str(e)}")
