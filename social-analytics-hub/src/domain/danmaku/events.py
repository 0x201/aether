"""领域事件：纯数据，不依赖事件总线等基础设施。"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from .value_objects import AnalysisPeriod, AnalysisType


@dataclass(frozen=True, slots=True)
class DanmakuAnalysisCompletedDomainEvent:
    """弹幕词频分析完成事件。"""

    room_id: int | None
    start_time: datetime
    end_time: datetime
    analysis_type: AnalysisType
    period: AnalysisPeriod
    frequencies_count: int
    completed_at: datetime

    def to_integration_payload(self) -> dict[str, Any]:
        """转换为对外集成事件的负载（字段名与既有消费方契约保持一致）。"""
        return {
            "roomId": self.room_id,
            "startDate": self.start_time.isoformat(),
            "endDate": self.end_time.isoformat(),
            "periodType": self.period.value,
            "frequenciesCount": self.frequencies_count,
            "completedAt": self.completed_at.isoformat(),
        }
