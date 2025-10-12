from sqlalchemy.orm import Session
from sqlalchemy import delete, select

from src.crud.base import CRUDBase
from src.models.game_alteration_audit import GameAlterationAudit
from src.schemas.game_alteration_audit import (
    GameAlterationAuditCreate,
    GameAlterationAuditUpdate,
)


class CRUDGameAlterationAudit(
    CRUDBase[GameAlterationAudit, GameAlterationAuditCreate, GameAlterationAuditUpdate]
):
    def create(
        self, db: Session, *, obj_in: GameAlterationAudit
    ) -> GameAlterationAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_all(self, db: Session) -> list[GameAlterationAudit]:
        stmt = select(GameAlterationAudit).order_by(
            GameAlterationAudit.publish_date.desc()
        )
        result = db.execute(stmt)
        return result.scalars().all()

    def multiple_create(
        self, db: Session, *, objs_in: list[GameAlterationAudit]
    ) -> None:
        db.add_all(objs_in)
        db.commit()

    # def get_latest_date(self, db: Session) -> datetime.datetime:
    #     stmt = select(GameAlterationAudit).order_by(GameAlterationAudit.publish_date.desc()).limit(1)
    #     result = db.execute(stmt)
    #     return result.scalars().first().publish_date

    def delete_all(self, db: Session) -> None:
        stmt = delete(GameAlterationAudit)
        db.execute(stmt)
        db.commit()

    def is_empty(self, db: Session) -> bool:
        stmt = select(GameAlterationAudit).limit(1)
        result = db.execute(stmt)
        return result.scalars().first() is None


game_alteration_audit = CRUDGameAlterationAudit(GameAlterationAudit)
