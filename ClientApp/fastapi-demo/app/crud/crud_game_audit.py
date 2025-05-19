import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app import models
from app.crud.base import CRUDBase
from app.models.game_audit import GameAudit
from app.schemas.game_audit import GameAuditCreate, GameAuditUpdate
from app.schemas.paged_result import PagedResult


class CRUDGameAudit(CRUDBase[GameAudit, GameAuditCreate, GameAuditUpdate]):
    def create(self, db: Session, *, obj_in: GameAudit) -> GameAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_all(self, db: Session) -> list[GameAudit]:
        return db.query(GameAudit).order_by(GameAudit.publish_date.desc()).all()

    def get_paged_audits(
        self, db: Session, title: Optional[str], skip: int = 0, limit: int = 10
    ) -> PagedResult:
        query = db.query(GameAudit)
        if title:
            query = query.filter(models.GameAudit.title.like(f"%{title}%"))

        audits = query.order_by('id').offset(skip).limit(limit).all()
        total_count = query.count()
        return PagedResult(total_count=total_count, data=audits)

    def multiple_create(self, db: Session, *, objs_in: list[GameAudit]) -> None:
        db.add_all(objs_in)
        db.commit()

    def get_latest_date(self, db: Session) -> datetime.datetime:
        """获取最新发布日期"""
        return (
            db.query(GameAudit)
            .order_by(GameAudit.publish_date.desc())
            .first()
            .publish_date
        )

    def delete_all(self, db: Session) -> None:
        """删除所有数据"""
        db.query(GameAudit).delete()
        db.commit()

    def is_empty(self, db: Session) -> bool:
        return False if db.query(GameAudit).first() else True


game_audit = CRUDGameAudit(GameAudit)
