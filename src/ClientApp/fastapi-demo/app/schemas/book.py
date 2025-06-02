from typing import Optional

from pydantic import BaseModel


class BookBase(BaseModel):
    title: Optional[str] = None
    price: float = 0.0
    isbn: Optional[str] = None
    cover_img: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    paperback: int = 0
    publish_date: Optional[str] = None
    author_id: Optional[int] = 0
    is_active: Optional[bool] = False


class BookCreate(BookBase):
    author_id: int
    is_active: bool


class BookUpdate(BookBase):
    pass


class BookInDBBase(BookBase):
    id: int
    title: str
    author_id: int

    class Config:
        from_attributes = True


class Book(BookInDBBase):
    pass
