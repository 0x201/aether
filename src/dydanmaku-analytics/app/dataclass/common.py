from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PagedRequestBase(BaseModel):
    page: int = Field(default=1, description="Current page number")
    pageSize: int = Field(default=10, description="Number of items per page")


class ResultBase(BaseModel):
    status: int = Field(default=200, description="HTTP status code")
    message: str = Field(
        default="Request successfully", description="HTTP status message"
    )

    @staticmethod
    def success(message: str = "Request successfully") -> "ResultBase":
        return ResultBase(status=200, message=message)

    @staticmethod
    def fail(message: str = "Request failed") -> "ResultBase":
        return ResultBase(status=400, message=message)


class PagedResult(ResultBase, Generic[T]):
    data: List[T] = Field(default=[], description="List of items")
    totalCount: int = Field(default=0, description="Total number of items")
