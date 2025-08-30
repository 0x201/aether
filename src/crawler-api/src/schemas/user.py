from typing import Optional

from pydantic import BaseModel


class UserBase(BaseModel):
    username: Optional[str] = None
    is_active: Optional[bool] = True
    nickname: Optional[str] = None


class UserCreate(UserBase):
    username: str
    password: str


class UserUpdate(UserBase):
    password: Optional[str] = None
    salt: Optional[str] = None


class UserInDBBase(UserBase):
    id: Optional[int] = None

    class ConfigDict:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    password: str
