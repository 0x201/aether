from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select

from src.domain.danmaku.entities import DanmakuAnalysisEntity
from src.domain.danmaku.repositories import DanmakuAnalysisRepository
from src.infrastructure.database.manager import PsycopgDbSessionManager
from src.infrastructure.persistence.models.danmaku_analysis import DanmakuAnalysisModel


class SqlAlchemyDanmakuAnalysisRepo(DanmakuAnalysisRepository):
    def __init__(self, db_manager: PsycopgDbSessionManager):
        self.db_manager: PsycopgDbSessionManager = db_manager

    # =================================================
    # Commands
    # =================================================
    def add(self, entity_to_add: DanmakuAnalysisEntity) -> DanmakuAnalysisEntity:
        with self.db_manager.sync_uow() as session:
            model = DanmakuAnalysisModel(
                room_id=entity_to_add.room_id,
                start_time=entity_to_add.start_time,
                end_time=entity_to_add.end_time,
                type=entity_to_add.type,
                frequencies=entity_to_add.frequencies,
                created_at=datetime.now(timezone(timedelta(hours=8))),
            )
            session.add(model)
            session.flush()

            entity_to_add.id = model.id
        return entity_to_add

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
        with self.db_manager.sync_session() as session:
            stmt = select(DanmakuAnalysisModel)

            if start_time and end_time:
                stmt = stmt.where(
                    and_(
                        DanmakuAnalysisModel.start_time == start_time,
                        DanmakuAnalysisModel.end_time == end_time,
                    )
                )

            if type:
                stmt = stmt.where(DanmakuAnalysisModel.type == type)

            if room_id:
                stmt = stmt.where(DanmakuAnalysisModel.room_id == room_id)

            model = session.execute(stmt).scalar_one_or_none()

            return (
                DanmakuAnalysisEntity(
                    id=model.id,
                    room_id=model.room_id,
                    start_time=model.start_time,
                    end_time=model.end_time,
                    type=model.type,
                    frequencies=model.frequencies,
                    created_at=model.created_at,
                )
                if model
                else None
            )
