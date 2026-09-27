"""HTTP 契约公共模型。"""

from pydantic import BaseModel, Field


class ResultBase(BaseModel):
    """统一响应包装基类。"""

    status: int = Field(default=200, description="HTTP status code")
    message: str = Field(
        default="Request successfully", description="HTTP status message"
    )

    @staticmethod
    def success(message: str = "Request successfully") -> ResultBase:
        return ResultBase(status=200, message=message)

    @staticmethod
    def fail(message: str = "Request failed") -> ResultBase:
        return ResultBase(status=400, message=message)


class PagedResult[T](ResultBase):
    """分页响应包装。"""

    data: list[T] = Field(default_factory=list, description="List of items")
    totalCount: int = Field(default=0, description="Total number of items")
