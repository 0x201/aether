from sqlalchemy.orm import Session
from sqlalchemy import delete, select

from src.crud.base import CRUDBase
from src.models.game_revocation_audit import GameRevocationAudit
from src.schemas.game_revocation_audit import (
    GameRevocationAuditCreate,
    GameRevocationAuditUpdate,
)


class CRUDGameRevocationAudit(
    CRUDBase[GameRevocationAudit, GameRevocationAuditCreate, GameRevocationAuditUpdate]
):
    def create(
        self, db: Session, *, obj_in: GameRevocationAudit
    ) -> GameRevocationAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_all(self, db: Session) -> list[GameRevocationAudit]:
        stmt = select(GameRevocationAudit).order_by(GameRevocationAudit.publish_date.desc())
        result = db.execute(stmt)
        return result.scalars().all()

    def multiple_create(
        self, db: Session, *, objs_in: list[GameRevocationAudit]
    ) -> None:
        db.add_all(objs_in)
        db.commit()

    # def get_latest_date(self, db: Session) -> datetime.datetime:
    #     stmt = select(GameRevocationAudit).order_by(GameRevocationAudit.publish_date.desc()).limit(1)
    #     result = db.execute(stmt)
    #     return result.scalars().first().publish_date

    def delete_all(self, db: Session) -> None:
        stmt = delete(GameRevocationAudit)
        db.execute(stmt)
        db.commit()

    def is_empty(self, db: Session) -> bool:
        stmt = select(GameRevocationAudit).limit(1)
        result = db.execute(stmt)
        return result.scalars().first() is None


game_revocation_audit = CRUDGameRevocationAudit(GameRevocationAudit)