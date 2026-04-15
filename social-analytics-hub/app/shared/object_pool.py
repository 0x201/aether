import threading
import time
from collections import deque
from dataclasses import dataclass
from statistics import mean
from typing import Callable, Generic, Optional, TypeVar

T = TypeVar("T")


@dataclass
class ObjectPoolStats:
    """Statistics for object pool usage"""

    total_acquired: int = 0
    total_released: int = 0
    total_created: int = 0
    peak_pool_size: int = 0
    average_pool_size: float = 0
    last_acquire_time: Optional[float] = None
    last_release_time: Optional[float] = None


class ObjectPool(Generic[T]):
    """Thread-safe object pool for reusing objects of any type with statistics tracking"""

    def __init__(
        self,
        factory: Callable[[], T],
        size: int = 16,
        reset_func: Optional[Callable[[T], None]] = None,
        prepopulate: bool = False,
    ):
        self.pool: deque[T] = deque()
        self.factory = factory
        self.size = size
        self.reset_func = reset_func

        # Statistics tracking
        self.stats = ObjectPoolStats()
        self.pool_sizes_history = []

        # Thread safety
        self.lock = threading.RLock()

        # Pre-populate the pool
        if prepopulate:
            for _ in range(size):
                obj = self.factory()
                self.stats.total_created += 1
                self.pool.append(obj)

        self.stats.peak_pool_size = size
        self.stats.average_pool_size = size

    def acquire(self) -> T:
        """Acquire an object from the pool or create a new one if pool is empty"""
        with self.lock:
            if self.pool:
                obj = self.pool.popleft()
            else:
                # Create new object if pool is empty
                obj = self.factory()
                self.stats.total_created += 1

            # Update stats
            self.stats.total_acquired += 1
            self.stats.last_acquire_time = time.time()
            self._update_pool_stats()

            return obj

    def release(self, obj: T):
        """Return an object to the pool if there's space"""
        # Reset object using custom reset function if provided
        if self.reset_func:
            self.reset_func(obj)

        with self.lock:
            if len(self.pool) < self.size:
                self.pool.append(obj)

            # Update stats
            self.stats.total_released += 1
            self.stats.last_release_time = time.time()
            self._update_pool_stats()

    def _update_pool_stats(self):
        """Update pool statistics"""
        current_size = len(self.pool)

        if len(self.pool_sizes_history) >= 1000:
            self.pool_sizes_history.pop(0)
        self.pool_sizes_history.append(current_size)

        if current_size > self.stats.peak_pool_size:
            self.stats.peak_pool_size = current_size

        if self.pool_sizes_history:
            self.stats.average_pool_size = mean(self.pool_sizes_history)

    def get_stats(self) -> ObjectPoolStats:
        """Get current pool statistics"""
        with self.lock:
            # Return a copy to prevent external modification
            return ObjectPoolStats(
                total_acquired=self.stats.total_acquired,
                total_released=self.stats.total_released,
                total_created=self.stats.total_created,
                peak_pool_size=self.stats.peak_pool_size,
                average_pool_size=self.stats.average_pool_size,
                last_acquire_time=self.stats.last_acquire_time,
                last_release_time=self.stats.last_release_time,
            )

    def reset_stats(self):
        """Reset pool statistics"""
        with self.lock:
            self.stats = ObjectPoolStats()
            self.pool_sizes_history.clear()

    def close(self):
        """Close the pool and clear all objects"""
        with self.lock:
            self.pool.clear()
            self.pool_sizes_history.clear()

    def current_size(self) -> int:
        """Get the current number of objects in the pool"""
        with self.lock:
            return len(self.pool)
