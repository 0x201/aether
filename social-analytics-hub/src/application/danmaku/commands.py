"""写用例（Command + Handler）。"""

from dataclasses import dataclass
from datetime import UTC, datetime

from loguru import logger

from src.domain.danmaku.value_objects import AnalysisPeriod, AnalysisType

from .dtos import AnalysisRunSummaryDto, DanmakuAnalysisDto
from .services import DanmakuAnalyzer


@dataclass(frozen=True, slots=True)
class GenerateAnalysisCommand:
    """为指定时间区间（可选房间）生成词频分析。"""

    start_time: datetime
    end_time: datetime
    room_id: int | None = None
    period: AnalysisPeriod = AnalysisPeriod.HOURLY
    top_n: int = 100


@dataclass(frozen=True, slots=True)
class PrecomputeAllRoomsCommand:
    """为全部活跃房间生成词频分析。"""

    start_time: datetime
    end_time: datetime
    period: AnalysisPeriod = AnalysisPeriod.HOURLY
    top_n: int = 100


class GenerateAnalysisHandler:
    def __init__(self, analyzer: DanmakuAnalyzer) -> None:
        self._analyzer = analyzer

    async def handle(self, command: GenerateAnalysisCommand) -> DanmakuAnalysisDto:
        return await self._analyzer.precompute_analyses(
            start_time=command.start_time,
            end_time=command.end_time,
            room_id=command.room_id,
            period_type=command.period,
            top_n=command.top_n,
        )


class PrecomputeAllRoomsHandler:
    def __init__(self, analyzer: DanmakuAnalyzer) -> None:
        self._analyzer = analyzer

    async def handle(self, command: PrecomputeAllRoomsCommand) -> AnalysisRunSummaryDto:
        logger.info(
            f"Precomputing {command.period.value} analyses for all rooms in "
            f"[{command.start_time}, {command.end_time}]"
        )
        analysed_rooms = await self._analyzer.precompute_for_all_rooms(
            period_type=command.period,
            start_time=command.start_time,
            end_time=command.end_time,
            top_n=command.top_n,
        )
        return AnalysisRunSummaryDto(
            room_id=None,
            start_time=command.start_time,
            end_time=command.end_time,
            period_type=command.period,
            type=AnalysisType.COMBINED.value,
            analysed_rooms=analysed_rooms,
            frequencies_count=analysed_rooms,
            created_at=datetime.now(UTC),
        )
