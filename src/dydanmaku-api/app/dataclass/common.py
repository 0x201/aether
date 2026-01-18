from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationListBase(BaseModel, Generic[T]):
    data: List[T] = Field(default=[], description="List of items")
    total: int = Field(default=0, description="Total number of items")
    page: int = Field(default=1, description="Current page number")
    limit: int = Field(default=10, description="Number of items per page")
