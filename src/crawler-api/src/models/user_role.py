from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from src.db.base_class import Base


class UserRole(Base):
    __tablename__ = "UserRole"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    user_id: Mapped[int] = mapped_column(Integer, name="UserId")
    role_id: Mapped[int] = mapped_column(Integer, name="RoleId")
    assigned_at: Mapped[str] = mapped_column(
        DateTime, name="AssignedAt", server_default=func.now()
    )
    assigned_by: Mapped[str] = mapped_column(String, name="AssignedBy", nullable=True)

    user = relationship("User", back_populates="user_roles", primaryjoin="foreign(UserRole.user_id)==User.id")
    role = relationship("Role", back_populates="user_roles", primaryjoin="foreign(UserRole.role_id)==Role.id")
