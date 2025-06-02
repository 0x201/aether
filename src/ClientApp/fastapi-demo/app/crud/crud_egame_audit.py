from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.egame_audit import EGameAudit
from app.schemas.egame_audit import EGameAuditCreate, EGameAuditUpdate


class CRUDEGameAudit(CRUDBase[EGameAudit, EGameAuditCreate, EGameAuditUpdate]):
    def create(self, db: Session, *, obj_in: EGameAudit) -> EGameAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_all(self, db: Session) -> list[EGameAudit]:
        return db.query(EGameAudit).order_by(EGameAudit.publish_date.desc()).all()

    def multiple_create(self, db: Session, *, objs_in: list[EGameAudit]) -> None:
        db.add_all(objs_in)
        db.commit()

    # def get_latest_date(self, db: Session) -> datetime.datetime:
    #     """获取最新发布日期"""
    #     return db.query(NPPATable).order_by(NPPATable.publish_date.desc()).first().publish_date

    def delete_all(self, db: Session) -> None:
        """删除所有数据"""
        db.query(EGameAudit).delete()
        db.commit()

    def is_empty(self, db: Session) -> bool:
        return False if db.query(EGameAudit).first() else True


egame_audit = CRUDEGameAudit(EGameAudit)
