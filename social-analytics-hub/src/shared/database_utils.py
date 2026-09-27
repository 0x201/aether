from __future__ import annotations

from typing import Any, TypeVar

from loguru import logger
from sqlalchemy import Select, asc, desc

T = TypeVar("T")


class DatabaseUtils[T]:
    def __init__(self, model_class: type[T]):
        self.model_class = model_class

    def apply_order_by(
        self, stmt: Select[tuple[Any, ...]], sort_str: str | None = None
    ) -> Select[tuple[Any, ...]]:
        """
        Apply order_by clause based on a string like
        "field1, field2, field3 desc, field4 asc"
        or "field1, field2, field3, asc, field4 desc"

        Args:
            stmt: SQLAlchemy select statement
            sort_str: String in format "field1, field2, field3 desc, field4 asc"
                      or "field1, field2, field3, asc, field4 desc"
                      where direction applies to the field preceding it,
                      and defaults to "desc" if not specified

        Returns:
            Modified SQLAlchemy statement with order_by applied
        """
        if not sort_str:
            return stmt
        try:
            default_column = getattr(self.model_class, "created_at")
            default_sort_stmt = stmt.order_by(desc(default_column))
        except AttributeError:
            default_column = getattr(self.model_class, "id")
            default_sort_stmt = stmt.order_by(desc(default_column))

        if not sort_str:
            return default_sort_stmt

        all_tokens = []
        for part in sort_str.split(","):
            all_tokens.extend(
                [token.strip() for token in part.split() if token.strip()]
            )

        order_applied = False
        i = 0

        while i < len(all_tokens):
            token = all_tokens[i].strip()

            if not token:
                i += 1
                continue

            # Check if this token is a direction keyword
            if token.lower() in ["asc", "desc"]:
                # This shouldn't happen at the start or after another direction
                # This might be a misplaced direction, we'll handle it as needed
                if i == 0 or all_tokens[i - 1].lower() in ["asc", "desc"]:
                    logger.warning(
                        f"Unexpected direction keyword: {token} at position {i}, "
                        f"skipping in {self.model_class.__name__}"
                    )
                    i += 1
                    continue

                # Apply the direction to the previous field
                prev_field = all_tokens[i - 1]
                try:
                    column = getattr(self.model_class, prev_field)
                    if token.lower() == "asc":
                        stmt = stmt.order_by(asc(column))
                    else:
                        stmt = stmt.order_by(desc(column))
                except AttributeError:
                    logger.warning(
                        f"Invalid sort field: {prev_field}, "
                        f"skipping this field in {self.model_class.__name__}"
                    )
                i += 1
                continue

            field_name = token
            direction = "desc"  # Default direction

            if i + 1 < len(all_tokens) and all_tokens[i + 1].lower() in ["asc", "desc"]:
                direction = all_tokens[i + 1].lower()
                i += 2  # Skip both the field and the direction
            else:
                i += 1  # Just move to the next token

            # Apply the order by for this field
            try:
                column = getattr(self.model_class, field_name)
                if direction.lower() == "asc":
                    stmt = stmt.order_by(asc(column))
                else:
                    stmt = stmt.order_by(desc(column))
                order_applied = True
            except AttributeError:
                logger.warning(
                    f"Invalid sort field: {field_name}, "
                    f"skipping this field in {self.model_class.__name__}"
                )

        # If no valid fields were processed, use default sort
        if not order_applied:
            return default_sort_stmt

        return stmt
