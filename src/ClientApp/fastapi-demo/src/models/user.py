from sqlalchemy import Boolean, Column, String, Integer, Index
from sqlalchemy.orm import relationship
from src.db.base_class import Base, Auditable


class User(Base, Auditable):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(200), nullable=False)
    nickname = Column(String(200))
    password = Column(String(200), nullable=False)
    salt = Column(String(128), nullable=False)
    is_active = Column(Boolean, name="isActive", default=True, nullable=False)
    roles = relationship("Role", secondary="user_role", back_populates="users")


Index('IDX_USER_USERNAME', User.username, unique=True)
