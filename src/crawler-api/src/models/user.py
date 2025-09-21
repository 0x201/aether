from sqlalchemy import Boolean, String, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base_class import Base, Auditable


class User(Base, Auditable):
    __tablename__ = "Users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    username: Mapped[str] = mapped_column(String(200), name="Username")
    password: Mapped[str] = mapped_column(String(200), name="Password")
    nickname: Mapped[str] = mapped_column(String(200), name="Nickname", nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, name="IsActive")

    user_roles = relationship("UserRole", back_populates="user", primaryjoin="User.id==foreign(UserRole.user_id)")


Index("IDX_USER_USERNAME", "username", unique=True)
