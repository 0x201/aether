from typing import Optional
from pydantic import BaseModel


class AuthorDto(BaseModel):
    id: Optional[int] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    isActive: bool = False


class AuthorCreateDto(AuthorDto):
    firstName: str
    lastName: str


class AuthorUpdateDto(AuthorDto):
    pass
