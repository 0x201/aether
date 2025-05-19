from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.game_revocation_audit import GameRevocationAudit
from app.schemas.game_revocation_audit import (
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
        return (
            db.query(GameRevocationAudit)
            .order_by(GameRevocationAudit.publish_date.desc())
            .all()
        )

    def multiple_create(
        self, db: Session, *, objs_in: list[GameRevocationAudit]
    ) -> None:
        db.add_all(objs_in)
        db.commit()

    # def get_latest_date(self, db: Session) -> datetime.datetime:
    #     """获取最新发布日期"""
    #     return db.query(NPPATable).order_by(NPPATable.publish_date.desc()).first().publish_date

    def delete_all(self, db: Session) -> None:
        """删除所有数据"""
        db.query(GameRevocationAudit).delete()
        db.commit()

    def is_empty(self, db: Session) -> bool:
        return False if db.query(GameRevocationAudit).first() else True


game_revocation_audit = CRUDGameRevocationAudit(GameRevocationAudit)
