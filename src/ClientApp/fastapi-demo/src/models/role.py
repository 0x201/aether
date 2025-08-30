from sqlalchemy import Boolean, Column, Integer, String, Index
from sqlalchemy.orm import relationship

from src.db.base_class import Base, Auditable


class Role(Base, Auditable):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    is_active = Column(Boolean, name='isActive', default=True, nullable=False)
    users = relationship("User", secondary="user_role", back_populates="roles")


Index('IDX_ROLE_NAME', Role.name, unique=True)
