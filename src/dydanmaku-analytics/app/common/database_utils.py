from typing import Any, Optional, TypeVar, Generic, Tuple
from sqlalchemy import Select, asc, desc
from loguru import logger

T = TypeVar("T")


class DatabaseUtils(Generic[T]):
    def __init__(self, model_class: type[T]):
        self.model_class = model_class

    def apply_order_by(
        self, stmt: Select[Tuple[Any, ...]], sort_str: Optional[str] = None
    ) -> Select[Tuple[Any, ...]]:
        """
        Apply order_by clause based on a string like "field1, field2, field3 desc, field4 asc"
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
        # Default to created_at desc if sort_str is empty or model doesn't have created_at
        try:
            default_column = getattr(self.model_class, "created_at")
            default_sort_stmt = stmt.order_by(desc(default_column))
        except AttributeError:
            # If model doesn't have 'created_at', default to id desc
            default_column = getattr(self.model_class, "id")
            default_sort_stmt = stmt.order_by(desc(default_column))

        # Default to model's created_at/id desc if sort_str is empty
        if not sort_str:
            return default_sort_stmt

        # Flatten all tokens by splitting on commas and spaces
        # Then process tokens sequentially to identify field/direction pairs
        all_tokens = []
        for part in sort_str.split(","):
            all_tokens.extend(
                [token.strip() for token in part.split() if token.strip()]
            )

        # Process tokens to pair fields with their directions
        order_applied = False
        i = 0

        # Process tokens to find fields and their directions
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
                        f"Unexpected direction keyword: {token} at position {i}, skipping in {self.model_class.__name__}"
                    )
                    i += 1
                    continue

                # Apply the direction to the previous field
                prev_field = all_tokens[i - 1]
                try:
                    column = getattr(self.model_class, prev_field)
                    if token.lower() == "asc":
                        # Replace the previous default ordering with the specified one
                        # We need to reconstruct the statement without the previous default order for this field
                        stmt = stmt.order_by(asc(column))
                    else:
                        stmt = stmt.order_by(desc(column))
                    # We don't increment order_applied here as it was already counted when processing the field
                except AttributeError:
                    logger.warning(
                        f"Invalid sort field: {prev_field}, skipping this field in {self.model_class.__name__}"
                    )
                i += 1
                continue

            # This is a field name, check if the next token is a direction
            field_name = token
            direction = "desc"  # Default direction

            # Look ahead to see if the next token is a direction
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
                # If field doesn't exist, log warning but continue processing other fields
                logger.warning(
                    f"Invalid sort field: {field_name}, skipping this field in {self.model_class.__name__}"
                )

        # If no valid fields were processed, use default sort
        if not order_applied:
            return default_sort_stmt

        return stmt
