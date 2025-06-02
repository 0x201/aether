from typing import Optional

from pydantic import BaseModel


class AuthorBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool = False


class AuthorCreate(AuthorBase):
    first_name: str
    last_name: str


class AuthorUpdate(AuthorBase):
    pass


class AuthorInDBBase(AuthorBase):
    id: int

    class Config:
        from_attributes = True


class Author(AuthorInDBBase):
    pass
