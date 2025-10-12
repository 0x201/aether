import datetime
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from src.crud.base import CRUDBase
from src.models.game_audit import GameAudit
from src.schemas.game_audit import GameAuditCreate, GameAuditUpdate
from src.schemas.paged_result import PagedResult


class CRUDGameAudit(CRUDBase[GameAudit, GameAuditCreate, GameAuditUpdate]):
    def create(self, db: Session, *, obj_in: GameAudit) -> GameAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_all(self, db: Session) -> list[GameAudit]:
        stmt = select(GameAudit).order_by(GameAudit.publish_date.desc())
        result = db.execute(stmt)
        return result.scalars().all()

    def get_paged_audits(
        self, db: Session, title: Optional[str], skip: int = 0, limit: int = 10
    ) -> PagedResult:
        stmt = select(GameAudit)
        count_stmt = select(func.count()).select_from(GameAudit)

        if title:
            stmt = stmt.where(GameAudit.title.like(f"%{title}%"))
            count_stmt = count_stmt.where(GameAudit.title.like(f"%{title}%"))

        stmt = stmt.order_by(GameAudit.id).offset(skip).limit(limit)
        result = db.execute(stmt)
        audits = result.scalars().all()

        count_result = db.execute(count_stmt)
        total_count = count_result.scalar()

        return PagedResult(items=audits, totalCount=total_count)

    def multiple_create(self, db: Session, *, objs_in: list[GameAudit]) -> None:
        db.add_all(objs_in)
        db.commit()

    def get_latest_date(self, db: Session) -> datetime.datetime:
        """获取最新发布日期"""
        stmt = select(GameAudit).order_by(GameAudit.publish_date.desc()).limit(1)
        result = db.execute(stmt)
        game_audit = result.scalars().first()
        return game_audit.publish_date if game_audit else datetime.datetime.min

    def delete_all(self, db: Session) -> None:
        """删除所有数据"""
        stmt = delete(GameAudit)
        db.execute(stmt)
        db.commit()

    def is_empty(self, db: Session) -> bool:
        stmt = select(GameAudit).limit(1)
        result = db.execute(stmt)
        return result.scalars().first() is None


game_audit = CRUDGameAudit(GameAudit)
