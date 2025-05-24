from sqlalchemy import Column, Integer, ForeignKey, Index

from app.db.base_class import Base


class UserRole(Base):
    __tablename__ = "user_role"
    user_id = Column('user_id', Integer, ForeignKey('users.id', name='FK_USER_ROLE_USER_ID'), primary_key=True)
    role_id = Column('role_id', Integer, ForeignKey('roles.id', name='FK_USER_ROLE_ROLE_ID'), primary_key=True)


Index('IDX_USER_ROLE_USER_ID',UserRole.user_id, unique=True)
Index('IDX_USER_ROLE_ROLE_ID', UserRole.role_id, unique=True)