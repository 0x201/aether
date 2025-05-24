import datetime
from typing import Optional, Union, Dict, Any

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def create(self, db: Session, *, create_user_command: UserCreate) -> User:
        salt, password = get_password_hash(create_user_command.password)
        user_to_add = User()
        user_to_add.username = create_user_command.username,
        user_to_add.password = password,
        user_to_add.salt = salt,
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
        if update_data["password"]:
            salt, password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password"] = password
            update_data["salt"] = salt
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password.encode('utf-8'), user.password.encode('utf-8')):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, db: Session, *, user: User) -> bool:
        role = db.query(Role).filter(Role.name == 'admin').first()
        if not role:
            return False
        return user.role_id == role.id


user = CRUDUser(User)
