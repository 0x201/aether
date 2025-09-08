from typing import Optional, List

from pydantic import BaseModel
from src.schemas.author import Author


class BookBase(BaseModel):
    title: Optional[str] = None
    price: float = 0.0
    isbn: Optional[str] = None
    description: Optional[str] = None
    publish_date: Optional[str] = None
    is_active: Optional[bool] = False
    author_ids: Optional[List[int]] = []


class BookCreate(BookBase):
    is_active: bool


class BookUpdate(BookBase):
    pass


class BookInDBBase(BookBase):
    id: int
    title: str
    authors: List[Author] = []

    class ConfigDict:
        from_attributes = True


class Book(BookInDBBase):
    pass
