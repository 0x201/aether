from sqlalchemy.orm import Session
from sqlalchemy.sql import delete, select

from src.crud.base import CRUDBase
from src.models.egame_audit import EGameAudit
from src.schemas.egame_audit import EGameAuditCreate, EGameAuditUpdate


class CRUDEGameAudit(CRUDBase[EGameAudit, EGameAuditCreate, EGameAuditUpdate]):
    def create(self, db: Session, *, obj_in: EGameAudit) -> EGameAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_all(self, db: Session) -> list[EGameAudit]:
        stmt = select(EGameAudit).order_by(EGameAudit.publish_date.desc())
        result = db.execute(stmt)
        return result.scalars().all()

    def multiple_create(self, db: Session, *, objs_in: list[EGameAudit]) -> None:
        db.add_all(objs_in)
        db.commit()

    # def get_latest_date(self, db: Session) -> datetime.datetime:
    #     """获取最新发布日期"""
    #     stmt = select(EGameAudit).order_by(EGameAudit.publish_date.desc()).limit(1)
    #     result = db.execute(stmt)
    #     return result.scalars().first().publish_date

    def delete_all(self, db: Session) -> None:
        """删除所有数据"""
        stmt = delete(EGameAudit)
        db.execute(stmt)
        db.commit()

    def is_empty(self, db: Session) -> bool:
        stmt = select(EGameAudit).limit(1)
        result = db.execute(stmt)
        return result.scalars().first() is None


egame_audit = CRUDEGameAudit(EGameAudit)
