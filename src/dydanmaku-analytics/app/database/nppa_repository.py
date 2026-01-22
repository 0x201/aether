from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .nppa_models import (
    GameAudit,
    NetworkGameAudit,
    EGameAudit,
    GameAlterationAudit,
    GameRevocationAudit,
)


class NPPARepository:
    """
    Repository class for NPPA Game Audit entity with full CRUD operations
    """

    def __init__(self, session: Session):
        self.session = session

    def get_latest_game_audit(self) -> Optional[GameAudit]:
        """Get the latest game audit based on publish date."""
        stmt = select(GameAudit).order_by(GameAudit.publish_date.desc()).limit(1)
        result = self.session.execute(stmt).scalar_one_or_none()
        return result

    def insert_many_game_audits(self, audits: List[GameAudit]):
        """Insert multiple game audits into the database."""
        try:
            self.session.add_all(audits)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise e

    def insert_many_network_game_audits(self, audits: List[NetworkGameAudit]):
        """Insert multiple network game audits into the database."""
        try:
            self.session.add_all(audits)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise e

    def insert_many_egame_audits(self, audits: List[EGameAudit]):
        """Insert multiple egame audits into the database."""
        try:
            self.session.add_all(audits)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise e

    def insert_many_game_alteration_audits(self, audits: List[GameAlterationAudit]):
        """Insert multiple game alteration audits into the database."""
        try:
            self.session.add_all(audits)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise e

    def insert_many_game_revocation_audits(self, audits: List[GameRevocationAudit]):
        """Insert multiple game revocation audits into the database."""
        try:
            self.session.add_all(audits)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise e

    def get_paged_network_game_audits(
        self,
        page: int,
        page_size: int,
        name: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> Tuple[List[NetworkGameAudit], int]:
        stmt = select(NetworkGameAudit)
        count_stmt = select(func.count()).select_from(NetworkGameAudit)

        if name:
            stmt = stmt.where(NetworkGameAudit.name.like(f"%{name}%"))
            count_stmt = count_stmt.where(NetworkGameAudit.name.like(f"%{name}%"))

        if start_time:
            stmt = stmt.where(NetworkGameAudit.publish_date >= start_time)
            count_stmt = count_stmt.where(NetworkGameAudit.publish_date >= start_time)

        if end_time:
            stmt = stmt.where(NetworkGameAudit.publish_date <= end_time)
            count_stmt = count_stmt.where(NetworkGameAudit.publish_date <= end_time)

        if page < 0:
            page = 1

        page = page - 1

        stmt = (
            stmt.order_by(NetworkGameAudit.id).offset(page * page_size).limit(page_size)
        )
        result = self.session.execute(stmt)
        game_audits = result.scalars().unique().all()

        count_result = self.session.execute(count_stmt)
        total_count = count_result.scalar()

        return (list(game_audits), total_count or 0)
