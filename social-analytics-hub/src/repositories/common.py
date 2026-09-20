from typing import Any

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import Session


def get_generic_paged_data(
    session: Session,
    model: type,
    page: int,
    page_size: int,
    filters: dict[str, Any] | None = None,
    order_by: str | None = "id",
    custom_conditions: list[ColumnElement] | None = None,
) -> tuple[list, int]:
    """
    Generic paged data retrieval function.

    Parameters:
        model: SQLAlchemy Model
        page: page number
        page_size: the count of items per page
        filters: filter conditions. e.g. {"field_name": "value"}
        order_by: sort order. Default is "id".
        custom_conditions: custom conditions.

    Returns:
        Tuple[List, int]: a tuple containing the list of data and the total count.
    """
    stmt = select(model)
    count_stmt = select(func.count()).select_from(model)

    if filters:
        for field, value in filters.items():
            if value is not None:
                column = getattr(model, field, None)
                if column is not None:
                    if isinstance(value, str):
                        stmt = stmt.where(column.like(f"%{value}%"))
                        count_stmt = count_stmt.where(column.like(f"%{value}%"))
                    else:
                        stmt = stmt.where(column == value)
                        count_stmt = count_stmt.where(column == value)

    if custom_conditions:
        for condition in custom_conditions:
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

    if page < 1:
        page = 1
    page_index = page - 1

    order_column = getattr(model, order_by or "id")
    stmt = stmt.order_by(order_column).offset(page_index * page_size).limit(page_size)

    result = session.execute(stmt)
    data = result.scalars().unique().all()

    count_result = session.execute(count_stmt)
    total_count = count_result.scalar()

    return (list(data), total_count or 0)
