from typing import Any

from pydantic import BaseModel


class PagedResult(BaseModel):
    total_count: int
    data: list[Any]
