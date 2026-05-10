from typing import List, Optional, Tuple

from sqlalchemy import select, update

from .common import get_generic_paged_data
from .nppa_models import (
    EGameAudit,
    GameAlterationAudit,
    GameAudit,
    GameRevocationAudit,
    NetworkGameAudit,
)
from .session_factory import SessionFactory


class NPPARepository:
    """
    Repository class for NPPA Game Audit entity with full CRUD operations
    """

    def __init__(self, session_factory: SessionFactory):
        self.session_factory = session_factory

    def get_latest_game_audit(self) -> Optional[GameAudit]:
        """Get the latest game audit based on publish date."""
        with self.session_factory.query() as query:
            stmt = select(GameAudit).order_by(GameAudit.publish_date.desc()).limit(1)
            result = session.execute(stmt).scalar_one_or_none()
            return result

    def insert_many_game_audits(self, audits: List[GameAudit]) -> bool:
        """Insert multiple game audits into the database."""
        try:
            with self.session_factory.transaction() as transaction:
                transaction.add_all(audits)
                return True
        except Exception:
            return False

    def insert_many_network_game_audits(self, audits: List[NetworkGameAudit]):
        """Insert multiple network game audits into the database."""
        try:
            with self.session_factory.transaction() as transaction:
                transaction.add_all(audits)
        except Exception:
            return False

    def insert_many_egame_audits(self, audits: List[EGameAudit]):
        """Insert multiple egame audits into the database."""
        try:
            with self.session_factory.transaction() as transaction:
                transaction.add_all(audits)
        except Exception:
            return False

    def insert_many_game_alteration_audits(self, audits: List[GameAlterationAudit]):
        """Insert multiple game alteration audits into the database."""
        try:
            with self.session_factory.transaction() as transaction:
                transaction.add_all(audits)
        except Exception:
            return False

    def insert_many_game_revocation_audits(self, audits: List[GameRevocationAudit]):
        """Insert multiple game revocation audits into the database."""
        try:
            with self.session_factory.transaction() as transaction:
                transaction.add_all(audits)
        except Exception:
            return False

    def get_paged_network_game_audits(
        self,
        page: int,
        page_size: int,
        name: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> Tuple[List[NetworkGameAudit], int]:
        with self.session_factory.query() as session:
            conditions = []
            if start_time and end_time:
                conditions.append(NetworkGameAudit.publish_date >= start_time)
                conditions.append(NetworkGameAudit.publish_date <= end_time)
            audits = get_generic_paged_data(
                session,
                NetworkGameAudit,
                page=page,
                page_size=page_size,
                filters={"name": name},
                custom_conditions=conditions,
            )
            return audits

    def get_paged_game_audits(
        self,
        page: int,
        page_size: int,
        title: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> Tuple[List[GameAudit], int]:
        with self.session_factory.query() as session:
            conditions = []
            if start_time and end_time:
                conditions.append(NetworkGameAudit.publish_date >= start_time)
                conditions.append(NetworkGameAudit.publish_date <= end_time)

            audits = get_generic_paged_data(
                session,
                GameAudit,
                page=page,
                page_size=page_size,
                filters={"title": title},
                custom_conditions=conditions,
            )
            return audits

    def update_game_audit_publish_date_by_title(self, title: str, publish_date: str):
        """Update the publish date of a game audit by title."""
        with self.session_factory.transaction() as transaction:
            stmt = (
                update(GameAudit)
                .where(GameAudit.title == title)
                .values(publish_date=publish_date)
            )

            transaction.execute(stmt)
