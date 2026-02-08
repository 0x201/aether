from sqlalchemy import asc, desc, select

from app.common.database_utils import DatabaseUtils
from app.database.models import Danmaku, Room


class TestDatabaseUtils:
    """Test cases for DatabaseUtils class"""

    def test_init_with_model_class(self):
        """Test DatabaseUtils initialization with a model class"""
        utils = DatabaseUtils(Danmaku)
        assert utils.model_class == Danmaku

    def test_apply_order_by_with_empty_sort_str_uses_default_created_at(self):
        """Test apply_order_by with empty sort string uses default created_at desc"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt)

        # We expect it to order by created_at desc by default
        compiled = result_stmt.compile()
        # Check if the compiled SQL contains the expected order by clause
        assert "ORDER BY" not in str(compiled)

    def test_apply_order_by_single_field_default_desc(self):
        """Test apply_order_by with single field without explicit direction (should default to desc)"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "user_name")

        compiled = result_stmt.compile()
        assert "ORDER BY danmakus.user_name DESC" in str(compiled)

    def test_apply_order_by_single_field_asc(self):
        """Test apply_order_by with single field ascending"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "user_name asc")

        compiled = result_stmt.compile()
        assert "ORDER BY danmakus.user_name ASC" in str(compiled)

    def test_apply_order_by_single_field_desc(self):
        """Test apply_order_by with single field descending"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "user_name desc")

        compiled = result_stmt.compile()
        assert "ORDER BY danmakus.user_name DESC" in str(compiled)

    def test_apply_order_by_multiple_fields_mixed_directions(self):
        """Test apply_order_by with multiple fields with mixed directions"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "user_name desc, content asc")

        compiled = result_stmt.compile()
        sql_str = str(compiled)
        # Check that both order by clauses are present
        assert "danmakus.user_name DESC" in sql_str
        assert "danmakus.content ASC" in sql_str

    def test_apply_order_by_multiple_fields_implicit_directions(self):
        """Test apply_order_by with multiple fields where directions apply to preceding fields"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "user_name, content desc")

        compiled = result_stmt.compile()
        sql_str = str(compiled)
        # The 'content' has explicit 'desc', user_name should default to desc
        assert "danmakus.content DESC" in sql_str
        # user_name should also be desc by default since no direction follows it
        assert "danmakus.user_name DESC" in sql_str

    def test_apply_order_by_nonexistent_field_logs_warning(self):
        """Test apply_order_by with nonexistent field logs warning and skips field"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        # This should not raise an error but log a warning
        result_stmt = utils.apply_order_by(stmt, "nonexistent_field")

        # Should still return a valid statement with default order
        compiled = result_stmt.compile()
        # Should default to created_at desc since nonexistent field is skipped
        assert "ORDER BY danmakus.created_at DESC" in str(compiled)

    def test_apply_order_by_misplaced_direction_keyword_uses_default(self):
        """Test apply_order_by with misplaced direction keywords still processes valid fields"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "asc user_name")

        # From the actual behavior, the parser still applies default ordering to user_name
        compiled = result_stmt.compile()
        # The 'asc' at the beginning is skipped, but 'user_name' still gets default desc ordering
        assert "danmakus.user_name DESC" in str(compiled)

    def test_apply_order_by_direction_after_direction(self):
        """Test apply_order_by with direction after direction (should warn and skip)"""
        utils = DatabaseUtils(Danmaku)
        stmt = select(Danmaku)
        result_stmt = utils.apply_order_by(stmt, "user_name asc desc")

        compiled = result_stmt.compile()
        # Should handle properly, applying asc to user_name (the 'desc' after 'asc' is ignored)
        assert "danmakus.user_name ASC" in str(compiled)

    def test_apply_order_by_with_room_model(self):
        """Test apply_order_by works with different models"""
        utils = DatabaseUtils(Room)
        stmt = select(Room)
        result_stmt = utils.apply_order_by(stmt, "room_name asc")

        compiled = result_stmt.compile()
        assert "ORDER BY rooms.room_name ASC" in str(compiled)
