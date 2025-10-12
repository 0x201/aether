from typing import TypeVar, List, Generic
from pydantic import BaseModel

T = TypeVar("T")

class PagedResult(BaseModel, Generic[T]):
    items: List[T]
    totalCount: int

    class Config:
        arbitrary_types_allowed = True
