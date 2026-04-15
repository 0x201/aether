from app.shared.object_pool import ObjectPool


class SimpleClass:
    def __init__(self, value="default"):
        self.value = value


class TestObjectPool:
    def test_acquire_creates_new_object_when_empty(self, mocker):
        """Test that acquire creates a new object when pool is empty"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=2)

        obj = pool.acquire()

        assert isinstance(obj, SimpleClass)
        assert obj.value == "default"

    def test_acquire_returns_from_pool_when_available(self, mocker):
        """Test that acquire returns an object from the pool if available"""
        test_obj = SimpleClass("test_value")

        def factory():
            return test_obj

        pool = ObjectPool[SimpleClass](factory, size=2, prepopulate=True)

        # Pool is prepopulated, so acquire should get from pool, not create new
        obj = pool.acquire()

        assert obj is test_obj

    def test_release_adds_object_back_to_pool(self, mocker):
        """Test that release adds an object back to the pool"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=2)

        obj = pool.acquire()
        pool.release(obj)

        assert pool.current_size() == 1

    def test_pool_respects_size_limit(self, mocker):
        """Test that the pool respects the maximum size limit"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=2)

        # Acquire 3 objects (more than pool size)
        obj1 = pool.acquire()
        obj2 = pool.acquire()
        obj3 = pool.acquire()

        # Release all 3, but only 2 should go back to pool
        pool.release(obj1)
        pool.release(obj2)
        pool.release(obj3)

        # Size should still be 2 (the max size)
        assert pool.current_size() == 2

    def test_custom_reset_function_called_on_release(self, mocker):
        """Test that a custom reset function is called when releasing an object"""
        reset_func = mocker.Mock()
        test_obj = SimpleClass("test_value")

        def factory():
            return test_obj

        pool = ObjectPool[SimpleClass](factory, size=2, reset_func=reset_func)

        obj = pool.acquire()
        pool.release(obj)

        # Reset function should have been called once
        reset_func.assert_called_once_with(test_obj)

    def test_statistics_tracking(self, mocker):
        """Test that statistics are correctly tracked"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=2)

        obj1 = pool.acquire()
        obj2 = pool.acquire()
        pool.release(obj1)
        pool.release(obj2)

        stats = pool.get_stats()

        assert stats.total_acquired == 2
        assert stats.total_released == 2
        assert stats.total_created == 2

    def test_current_size_returns_correct_count(self, mocker):
        """Test that current_size returns the correct count of pooled objects"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=5, prepopulate=True)

        # Pool starts with 5 objects
        assert pool.current_size() == 5

        # Acquire 3 objects
        acquired = [pool.acquire() for _ in range(3)]
        assert pool.current_size() == 2  # 5 - 3 = 2

        # Release 2 objects
        for obj in acquired[:2]:
            pool.release(obj)
        assert pool.current_size() == 4  # 2 + 2 = 4

    def test_reset_stats_clears_statistics(self, mocker):
        """Test that reset_stats clears all statistics"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=2)

        # Perform some operations
        obj = pool.acquire()
        pool.release(obj)

        # Verify stats are not zero
        stats = pool.get_stats()
        assert stats.total_acquired > 0
        assert stats.total_released > 0

        # Reset stats
        pool.reset_stats()

        # Verify stats are reset
        stats = pool.get_stats()
        assert stats.total_acquired == 0
        assert stats.total_released == 0
        assert stats.total_created == 0

    def test_close_clears_pool_and_history(self, mocker):
        """Test that close clears the pool and history"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=5, prepopulate=True)

        # Verify pool has objects
        assert pool.current_size() == 5

        # Close the pool
        pool.close()

        # Verify pool is empty
        assert pool.current_size() == 0

    def test_get_stats_returns_copy(self, mocker):
        """Test that get_stats returns a copy that doesn't affect internal state"""

        def factory():
            return SimpleClass()

        pool = ObjectPool[SimpleClass](factory, size=2)

        obj = pool.acquire()
        pool.release(obj)

        stats = pool.get_stats()
        original_acquired = stats.total_acquired

        # Modify the returned stats
        stats.total_acquired = 999

        # Get stats again
        stats2 = pool.get_stats()

        # Should be unchanged
        assert stats2.total_acquired == original_acquired
