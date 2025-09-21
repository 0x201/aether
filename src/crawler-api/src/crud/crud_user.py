import datetime
from typing import Optional, Union, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.core.security import get_password_hash, verify_password
from src.crud.base import CRUDBase
from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        stmt = select(User).filter(User.username == username)
        result = db.execute(stmt)
        return result.scalars().first()

    def create(self, db: Session, *, create_user_command: UserCreate) -> User:
        password = get_password_hash(create_user_command.password)
        user_to_add = User()
        user_to_add.username = create_user_command.username,
        user_to_add.password = password,
        user_to_add.nickname = create_user_command.nickname,
        user_to_add.is_active = True,
        user_to_add.created_time = datetime.datetime.now()
        user_to_add.created_by = ''

        db.add(user_to_add)
        db.commit()
        db.refresh(user_to_add)
        return user_to_add

    def update(
            self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password"] = password
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password.encode(), user.password.encode()):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, *, user: User) -> bool:
        for role in user.roles:
            if role.name == 'admin':
                return True
        return False


user = CRUDUser(User)
