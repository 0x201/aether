from __future__ import annotations

from collections.abc import Callable
from datetime import datetime

from sqlalchemy import and_, select

from src.domain.danmaku.entities import DanmakuAnalysisEntity
from src.domain.danmaku.repositories import DanmakuAnalysisRepository
from src.infrastructure.database.interfaces import DatabaseSessionManager
from src.infrastructure.persistence.mappers.danmaku_mapper import (
    to_danmaku_analysis_entity,
    to_danmaku_analysis_model,
)
from src.infrastructure.persistence.models.danmaku_analysis import (
    DanmakuAnalysisModel,
)


class PostgresDanmakuAnalysisRepository(DanmakuAnalysisRepository):
    def __init__(self, db_manager: Callable[[], DatabaseSessionManager]) -> None:
        self.db_manager = db_manager

    # =================================================
    # Commands
    # =================================================
    def add(self, entity_to_add: DanmakuAnalysisEntity) -> DanmakuAnalysisEntity:
        with self.db_manager().sync_uow() as session:
            model = to_danmaku_analysis_model(entity_to_add)
            session.add(model)
            session.flush()
            return to_danmaku_analysis_entity(model)

    # =================================================
    # Queries
    # =================================================
    def get_analysis(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        type: str | None = None,
        room_id: int | None = None,
    ) -> DanmakuAnalysisEntity | None:
        with self.db_manager().sync_session() as session:
            stmt = self._build_query(
                start_time=start_time,
                end_time=end_time,
                analysis_type=type,
                room_id=room_id,
            )
            model = session.execute(stmt).scalars().first()
            return to_danmaku_analysis_entity(model) if model else None

    def list_analyses(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        type: str | None = None,
        room_id: int | None = None,
        limit: int = 100,
    ) -> list[DanmakuAnalysisEntity]:
        with self.db_manager().sync_session() as session:
            stmt = self._build_query(
                start_time=start_time,
                end_time=end_time,
                analysis_type=type,
                room_id=room_id,
            )
            stmt = stmt.order_by(DanmakuAnalysisModel.created_at.desc()).limit(limit)
            models = session.execute(stmt).scalars().all()
            return [to_danmaku_analysis_entity(model) for model in models]

    # =================================================
    # Internal
    # =================================================
    @staticmethod
    def _build_query(
        start_time: datetime | None,
        end_time: datetime | None,
        analysis_type: str | None,
        room_id: int | None,
    ):
        stmt = select(DanmakuAnalysisModel)
        if start_time is not None and end_time is not None:
            stmt = stmt.where(
                and_(
                    DanmakuAnalysisModel.start_time == start_time,
                    DanmakuAnalysisModel.end_time == end_time,
                )
            )
        elif start_time is not None:
            stmt = stmt.where(DanmakuAnalysisModel.start_time == start_time)
        elif end_time is not None:
            stmt = stmt.where(DanmakuAnalysisModel.end_time == end_time)

        if analysis_type is not None:
            stmt = stmt.where(DanmakuAnalysisModel.type == analysis_type)
        if room_id is not None:
            stmt = stmt.where(DanmakuAnalysisModel.room_id == room_id)
        return stmt
