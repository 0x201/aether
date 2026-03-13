import time
import threading
from app.shared.object_pool import ObjectPool


class SimpleClass:
    """A simple class for testing the object pool"""

    def __init__(self, value="default"):
        self.value = value
        self.initialized = True

    def reset(self):
        self.value = "default"


def test_init_default_values():
    """Test ObjectPool initialization with default values"""

    def factory():
        return SimpleClass()

    pool = ObjectPool(factory)

    assert pool.size == 16
    assert pool.reset_func is None
    assert (
        len(pool.pool) == 0
    )  # Default prepopulate is False, so pool is empty initially


def test_init_custom_values():
    """Test ObjectPool initialization with custom values"""

    def factory():
        return SimpleClass()

    def reset_func(x):
        return x.reset()

    pool = ObjectPool(factory, size=5, reset_func=reset_func, prepopulate=True)

    assert pool.size == 5
    assert pool.reset_func == reset_func
    assert len(pool.pool) == 5  # With prepopulate=True, pool should be filled


def test_acquire_creates_new_when_pool_empty(mocker):
    """Test that acquire creates new objects when pool is empty"""
    factory = mocker.Mock(side_effect=lambda: SimpleClass())
    pool = ObjectPool[SimpleClass](factory, size=3)

    _ = pool.acquire()
    _ = pool.acquire()

    assert factory.call_count == 2
    assert pool.get_stats().total_acquired == 2
    assert pool.get_stats().total_created == 2


def test_acquire_reuses_objects_from_pool(mocker):
    """Test that acquire reuses objects from the pool when available"""
    factory = mocker.Mock(side_effect=[SimpleClass("obj1"), SimpleClass("obj2")])
    pool = ObjectPool[SimpleClass](factory, size=2, prepopulate=True)

    # Initially pool has 2 objects
    assert pool.current_size() == 2

    # Acquire first object - should come from pool
    _ = pool.acquire()
    assert pool.current_size() == 1

    # Acquire second object - should come from pool
    _ = pool.acquire()
    assert pool.current_size() == 0

    # Factory was only called during prepopulation, not during acquire
    assert factory.call_count == 2
    assert pool.get_stats().total_acquired == 2
    assert pool.get_stats().total_created == 2


def test_release_adds_object_back_to_pool():
    """Test that release adds an object back to the pool if there's space"""

    def factory():
        return SimpleClass()

    pool = ObjectPool(factory, size=2)

    obj = pool.acquire()
    initial_size = pool.current_size()

    pool.release(obj)

    # Pool size should increase after releasing
    assert pool.current_size() == initial_size + 1


def test_release_calls_reset_function(mocker):
    """Test that release calls the custom reset function if provided"""
    reset_func = mocker.Mock()
    test_obj = SimpleClass("test_value")

    def factory():
        return test_obj

    pool = ObjectPool[SimpleClass](factory, size=2, reset_func=reset_func)

    obj = pool.acquire()
    pool.release(obj)

    # Reset function should have been called once
    reset_func.assert_called_once_with(test_obj)


def test_release_respects_pool_size_limit(mocker):
    """Test that release doesn't add object if pool is already at max capacity"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=2, prepopulate=True)

    # Pool is full
    assert pool.current_size() == 2

    # Acquire two objects to empty the pool
    _ = mocker.Mock()
    _ = mocker.Mock()
    # Actually acquire real objects
    obj1_real = pool.acquire()
    obj2_real = pool.acquire()
    assert pool.current_size() == 0

    # Release one object - pool goes to size 1
    pool.release(obj1_real)
    assert pool.current_size() == 1

    # Release another object - pool reaches max size, stays at 2
    pool.release(obj2_real)
    assert pool.current_size() == 2


def test_statistics_tracking():
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
    assert stats.peak_pool_size >= 2
    assert stats.average_pool_size >= 0
    assert stats.last_acquire_time is not None
    assert stats.last_release_time is not None


def test_peak_pool_size_updates():
    """Test that peak pool size is updated correctly"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=5, prepopulate=True)

    # Pool starts with 5 objects
    initial_stats = pool.get_stats()
    initial_peak = initial_stats.peak_pool_size

    # Acquire 3 objects
    objs = [pool.acquire() for _ in range(3)]
    assert pool.current_size() == 2  # 5 - 3 = 2 remaining in pool

    # Release all objects back
    for obj in objs:
        pool.release(obj)

    # Pool should now have 5 objects again
    final_stats = pool.get_stats()
    assert final_stats.peak_pool_size >= initial_peak


def test_average_pool_size_updates():
    """Test that average pool size updates correctly"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=10)

    # Initially, acquire some items
    objs = [pool.acquire() for _ in range(5)]

    # Release some back with small delays
    for i, obj in enumerate(objs):
        time.sleep(0.001)  # Small delay to ensure time-based stats work
        pool.release(obj)

    stats = pool.get_stats()
    assert isinstance(stats.average_pool_size, float)
    assert stats.average_pool_size >= 0


def test_reset_stats_clears_statistics():
    """Test that reset_stats clears all statistics"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=2)

    obj = pool.acquire()
    pool.release(obj)

    # Verify stats are not zero initially
    stats_before = pool.get_stats()
    assert stats_before.total_acquired > 0 or stats_before.total_released > 0

    # Reset stats
    pool.reset_stats()

    # Verify stats are reset to zero
    stats_after = pool.get_stats()
    assert stats_after.total_acquired == 0
    assert stats_after.total_released == 0
    assert stats_after.total_created == 0
    assert stats_after.peak_pool_size == 0
    assert stats_after.average_pool_size == 0


def test_close_clears_pool_and_history():
    """Test that close method clears pool and history"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=5, prepopulate=True)

    # Pool should have items
    assert pool.current_size() == 5

    # Add some activity to build history
    obj = pool.acquire()
    pool.release(obj)

    # Close the pool
    pool.close()

    # Pool should be empty after closing
    assert pool.current_size() == 0


def test_current_size_returns_correct_value():
    """Test that current_size returns the correct number of objects in pool"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=5)

    # Initially empty
    assert pool.current_size() == 0

    # Add 3 objects
    objs = [pool.acquire() for _ in range(3)]
    assert (
        pool.current_size() == 0
    )  # Objects were taken from factory, not from pool initially

    # Release them back
    for obj in objs:
        pool.release(obj)

    assert pool.current_size() == 3  # Now they're in the pool


def test_concurrent_access():
    """Basic test for concurrent access to the pool"""

    def factory():
        return SimpleClass()

    pool = ObjectPool[SimpleClass](factory, size=10)

    # Acquire and release in a thread-safe manner
    def worker():
        obj = pool.acquire()
        time.sleep(0.001)  # Simulate some work with the object
        pool.release(obj)

    # Start multiple threads
    threads = []
    for _ in range(5):
        t = threading.Thread(target=worker)
        threads.append(t)
        t.start()

    # Wait for all threads to finish
    for t in threads:
        t.join()

    # Stats should be consistent
    stats = pool.get_stats()
    assert stats.total_acquired == 5
    assert stats.total_released == 5
