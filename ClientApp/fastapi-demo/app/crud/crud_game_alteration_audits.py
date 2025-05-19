from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.game_alteration_audit import GameAlterationAudit
from app.schemas.game_alteration_audit import (
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
        return (
            db.query(GameAlterationAudit)
            .order_by(GameAlterationAudit.publish_date.desc())
            .all()
        )

    def multiple_create(
        self, db: Session, *, objs_in: list[GameAlterationAudit]
    ) -> None:
        db.add_all(objs_in)
        db.commit()

    # def get_latest_date(self, db: Session) -> datetime.datetime:
    #     """获取最新发布日期"""
    #     return db.query(NPPATable).order_by(NPPATable.publish_date.desc()).first().publish_date

    def delete_all(self, db: Session) -> None:
        """删除所有数据"""
        db.query(GameAlterationAudit).delete()
        db.commit()

    def is_empty(self, db: Session) -> bool:
        return False if db.query(GameAlterationAudit).first() else True


game_alteration_audit = CRUDGameAlterationAudit(GameAlterationAudit)
