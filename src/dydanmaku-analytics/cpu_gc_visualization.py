from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from app.shared import ObjectPool
import os
import time
import psutil
import gc
import tracemalloc
import matplotlib.pyplot as plt
import numpy as np


@dataclass
class Metadata:
    """Structured metadata class to replace dictionary-based metadata storage"""
    
    created_at: float = 0.0
    access_count: int = 0
    tags: Optional[List[str]] = None
    
    def __post_init__(self):
        """Initialize default values after dataclass initialization"""
        if self.created_at == 0.0:
            self.created_at = time.time()
        if self.tags is None:
            self.tags = []
    
    def increment_access_count(self):
        """Increment the access count"""
        self.access_count += 1
    
    def add_tag(self, tag: str):
        """Add a tag to the metadata"""
        if self.tags and tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str):
        """Remove a tag from the metadata"""
        if self.tags and tag in self.tags:
            self.tags.remove(tag)
    
    def reset(self):
        """Reset metadata to default state"""
        self.access_count = 0
        self.created_at = time.time()
        self.tags = []
    
    def update_from_dict(self, data: Dict[str, Any]):
        """Update metadata fields from a dictionary"""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary representation"""
        return {
            'created_at': self.created_at,
            'access_count': self.access_count,
            'tags': self.tags.copy() if self.tags else []
        }


class PerformanceSampleObject:
    def __init__(self, data_size=1000):
        # Increase the complexity and memory usage to trigger more GC pressure
        self.data = list(range(data_size))
        
        # Significantly increase nested data to create more complex objects
        self.nested_data = []
        for j in range(500):  # Increased from 200 to 500
            nested_item = {
                "id": j,
                "value": f"value_{j}_{'x' * 50}",  # Adding large strings to increase memory usage
                "extra": [j] * 20,  # Increased from 10 to 20
                "nested_list": [[k, k**2, k**3] for k in range(50)]  # Added nested list
            }
            self.nested_data.append(nested_item)
        
        # Increase computation-intensive initialization
        self.processed_data = [x**3 for x in range(1000)]  # Increased from 500 to 1000, and power from 2 to 3
        
        # Add more attributes to increase memory footprint
        self.matrix_data = [
            [i * j for j in range(50)] for i in range(50)
        ]  # 50x50 matrix
        
        # Large string to increase memory usage
        self.large_string = "A" * 10000  # 10KB string
        
        # Dictionary with many entries
        self.dictionary_data = {
            f"key_{i}": [f"val_{j}" for j in range(10)] for i in range(500)
        }
        
        # Multiple lists to increase memory and GC pressure
        self.additional_lists = [
            list(range(100)) for _ in range(20)
        ]
        
        self.timestamp = time.time()
        self.id = id(self)
        self.metadata = Metadata()

    def reset(self):
        """Reset object for reuse"""
        self.timestamp = time.time()
        self.metadata.reset()


def get_system_metrics():
    """Get system metrics"""
    process = psutil.Process(os.getpid())
    cpu_percent = process.cpu_percent()
    memory_rss = process.memory_info().rss / 1024 / 1024  # MB
    gc_counts = gc.get_count()  # Current garbage collection counts for each generation
    return cpu_percent, memory_rss, gc_counts


def count_garbage_collections():
    """Count garbage collections"""
    counts = gc.get_stats()
    # Return total collections for all generations
    total_collections = sum([count["collections"] for count in counts])
    collected_objects = sum([count["collected"] for count in counts])
    return total_collections, collected_objects


def cpu_gc_test_without_pool(iterations=1000):
    """Test CPU and GC performance without object pool"""
    print(
        f"Starting CPU/GC performance test without object pool, {iterations} iterations..."
    )

    # Start memory tracing
    tracemalloc.start()

    # Reset GC statistics
    gc.collect()

    cpu_samples = []
    memory_samples = []
    gc_collections = []
    creation_times = []
    timestamps = []

    for i in range(iterations):
        start_time = time.perf_counter()

        # Create object
        obj = PerformanceSampleObject(data_size=1500)

        # Simulate some operations
        obj.metadata.increment_access_count()
        obj.data[0] = i

        # Record creation+usage time
        creation_times.append(time.perf_counter() - start_time)

        # Record system metrics every certain number of iterations
        if i % 50 == 0:
            cpu, memory, _ = get_system_metrics()
            _, collected_count = count_garbage_collections()

            cpu_samples.append(cpu)
            memory_samples.append(memory)
            gc_collections.append(collected_count)
            timestamps.append(i)

        # Delete object
        del obj

        # Perform garbage collection every certain number of iterations
        if i % 50 == 0:
            gc.collect()

        if i % 200 == 0:
            print(f"  Completed {i}/{iterations}")

    tracemalloc.stop()
    return timestamps, cpu_samples, memory_samples, gc_collections, creation_times


def cpu_gc_test_with_pool(iterations=1000):
    """Test CPU and GC performance with object pool"""
    print(
        f"Starting CPU/GC performance test with object pool, {iterations} iterations..."
    )

    # Create object pool
    pool = ObjectPool[PerformanceSampleObject](
        factory=lambda: PerformanceSampleObject(data_size=1500),
        size=50,
        reset_func=lambda obj: obj.reset(),
        prepopulate=True,
    )

    # Start memory tracing
    tracemalloc.start()

    # Reset GC statistics
    gc.collect()

    cpu_samples = []
    memory_samples = []
    gc_collections = []
    creation_times = []
    timestamps = []

    for i in range(iterations):
        start_time = time.perf_counter()

        # Acquire object from pool
        obj = pool.acquire()

        # Simulate some operations
        obj.metadata.increment_access_count()
        obj.data[0] = i

        # Record acquisition+usage time
        creation_times.append(time.perf_counter() - start_time)

        # Record system metrics every certain number of iterations
        if i % 50 == 0:
            cpu, memory, _ = get_system_metrics()
            _, collected_count = count_garbage_collections()

            cpu_samples.append(cpu)
            memory_samples.append(memory)
            gc_collections.append(collected_count)
            timestamps.append(i)

        # Return object to pool
        pool.release(obj)

        # Perform garbage collection every certain number of iterations
        if i % 200 == 0:
            gc.collect()

        if i % 200 == 0:
            print(f"  Completed {i}/{iterations}")

    tracemalloc.stop()
    return timestamps, cpu_samples, memory_samples, gc_collections, creation_times


def visualize_cpu_gc_comparison():
    """Visualize CPU and GC comparison"""
    print("Starting CPU and GC performance comparison test...")

    # Get statistical data
    print("Collecting data without object pool...")
    no_pool_x, no_pool_cpu, no_pool_mem, no_pool_gc, no_pool_times = (
        cpu_gc_test_without_pool(iterations=1500)
    )

    print("Collecting data with object pool...")
    with_pool_x, with_pool_cpu, with_pool_mem, with_pool_gc, with_pool_times = (
        cpu_gc_test_with_pool(iterations=1500)
    )

    # Create charts
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))

    # CPU usage comparison
    axes[0, 0].plot(
        no_pool_x, no_pool_cpu, label="Without Pool", color="red", alpha=0.7
    )
    axes[0, 0].plot(
        with_pool_x, with_pool_cpu, label="With Pool", color="green", alpha=0.7
    )
    axes[0, 0].set_xlabel("Iterations")
    axes[0, 0].set_ylabel("CPU Usage (%)")
    axes[0, 0].set_title("CPU Usage Comparison")
    axes[0, 0].legend()
    axes[0, 0].grid(True, linestyle="--", alpha=0.6)

    # GC frequency comparison
    axes[0, 1].plot(no_pool_x, no_pool_gc, label="Without Pool", color="red", alpha=0.7)
    axes[0, 1].plot(
        with_pool_x, with_pool_gc, label="With Pool", color="green", alpha=0.7
    )
    axes[0, 1].set_xlabel("Iterations")
    axes[0, 1].set_ylabel("Garbage Collected Objects")
    axes[0, 1].set_title("Garbage Collection Statistics Comparison")
    axes[0, 1].legend()
    axes[0, 1].grid(True, linestyle="--", alpha=0.6)

    # Object creation/acquisition time comparison
    avg_time_no_pool = np.mean(no_pool_times)
    avg_time_with_pool = np.mean(with_pool_times)

    time_labels = ["Without Pool", "With Pool"]
    time_values = [
        avg_time_no_pool * 1000,
        avg_time_with_pool * 1000,
    ]  # Convert to milliseconds
    time_colors = ["red", "green"]

    bars = axes[0, 2].bar(time_labels, time_values, color=time_colors, alpha=0.7)
    axes[0, 2].set_ylabel("Average Time (ms)")
    axes[0, 2].set_title(
        f"Object Acquisition/Creation Time Comparison\n(Saved: {((avg_time_no_pool - avg_time_with_pool) / avg_time_no_pool * 100):.2f}%)"
    )

    for bar, value in zip(bars, time_values):
        height = bar.get_height()
        axes[0, 2].text(
            bar.get_x() + bar.get_width() / 2.0,
            height,
            f"{value:.2f}ms",
            ha="center",
            va="bottom",
        )

    # Memory usage comparison
    axes[1, 0].plot(
        no_pool_x, no_pool_mem, label="Without Pool", color="red", alpha=0.7
    )
    axes[1, 0].plot(
        with_pool_x, with_pool_mem, label="With Pool", color="green", alpha=0.7
    )
    axes[1, 0].set_xlabel("Iterations")
    axes[1, 0].set_ylabel("Memory Usage (MB)")
    axes[1, 0].set_title("Memory Usage Comparison")
    axes[1, 0].legend()
    axes[1, 0].grid(True, linestyle="--", alpha=0.6)

    # Time savings percentage
    time_saving = ((avg_time_no_pool - avg_time_with_pool) / avg_time_no_pool) * 100
    axes[1, 1].bar(["Time Savings"], [time_saving], color="blue", alpha=0.7)
    axes[1, 1].set_ylabel("Savings Percentage (%)")
    axes[1, 1].set_title("Object Acquisition Time Savings")

    axes[1, 1].text(
        0,
        time_saving + max(abs(time_saving) * 0.05, 0.5),
        f"{time_saving:.2f}%",
        ha="center",
        va="bottom",
    )

    # GC efficiency comparison
    if len(no_pool_gc) > 1 and len(with_pool_gc) > 1:
        # Calculate averages
        avg_gc_no_pool = np.mean(no_pool_gc)
        avg_gc_with_pool = np.mean(with_pool_gc)
        gc_saving = (
            ((avg_gc_no_pool - avg_gc_with_pool) / avg_gc_no_pool) * 100
            if avg_gc_no_pool != 0
            else 0
        )

        gc_labels = ["Without Pool", "With Pool"]
        gc_values = [avg_gc_no_pool, avg_gc_with_pool]
        gc_colors = ["red", "green"]

        gc_bars = axes[1, 2].bar(gc_labels, gc_values, color=gc_colors, alpha=0.7)
        axes[1, 2].set_ylabel("Average Garbage Collected Objects")
        axes[1, 2].set_title(
            f"Average GC Efficiency Comparison\nSaved: {gc_saving:.2f}%"
        )

        for bar, value in zip(gc_bars, gc_values):
            height = bar.get_height()
            axes[1, 2].text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{value:.2f}",
                ha="center",
                va="bottom",
            )
    else:
        axes[1, 2].text(
            0.5,
            0.5,
            "Insufficient GC data",
            horizontalalignment="center",
            verticalalignment="center",
            transform=axes[1, 2].transAxes,
        )
        axes[1, 2].set_title("Insufficient GC Data")

    plt.tight_layout()
    plt.savefig("cpu_gc_performance_analysis.png", dpi=300, bbox_inches="tight")
    print(
        "Fixed CPU/GC performance analysis chart saved to cpu_gc_performance_analysis.png"
    )

    # Print statistics summary
    print("\nDetailed Statistics Summary:")
    print(
        f"Average CPU usage without pool: {np.mean(no_pool_cpu) if no_pool_cpu else 0:.2f}%"
    )
    print(
        f"Average CPU usage with pool: {np.mean(with_pool_cpu) if with_pool_cpu else 0:.2f}%"
    )
    print(f"Average creation time without pool: {avg_time_no_pool * 1000:.2f} ms")
    print(f"Average acquisition time with pool: {avg_time_with_pool * 1000:.2f} ms")
    print(f"Time savings: {time_saving:.2f}%")

    if len(no_pool_gc) > 1 and len(with_pool_gc) > 1:
        avg_gc_no_pool = np.mean(no_pool_gc)
        avg_gc_with_pool = np.mean(with_pool_gc)
        gc_saving = (
            ((avg_gc_no_pool - avg_gc_with_pool) / avg_gc_no_pool) * 100
            if avg_gc_no_pool != 0
            else 0
        )
        print(f"GC efficiency improvement: {gc_saving:.2f}%")

    # Analyze object pool statistics
    sample_pool = ObjectPool[PerformanceSampleObject](
        factory=lambda: PerformanceSampleObject(data_size=1500),
        size=50,
        reset_func=lambda obj: obj.reset(),
        prepopulate=True,
    )

    # Perform operations to collect statistics
    start_time = time.perf_counter()
    for _ in range(100):
        obj = sample_pool.acquire()
        obj.metadata.increment_access_count()
        sample_pool.release(obj)
    end_time = time.perf_counter()

    avg_operation_time = (end_time - start_time) / 100 * 1000  # milliseconds

    stats = sample_pool.get_stats()
    print("\nObject Pool Statistics:")
    print(f"Total acquisitions: {stats.total_acquired}")
    print(f"Total releases: {stats.total_released}")
    print(f"Total creations: {stats.total_created}")
    print(f"Peak pool size: {stats.peak_pool_size}")
    print(f"Average pool size: {stats.average_pool_size:.2f}")
    print(f"Average pool operation time: {avg_operation_time:.4f} ms")

    # Performance benefits summary
    print("\nPerformance Benefits Summary:")
    print(
        f"✅ Object pool reduced object acquisition time from {avg_time_no_pool * 1000:.2f}ms to {avg_time_with_pool * 1000:.2f}ms"
    )
    print(f"✅ Time performance improvement: {time_saving:.2f}%")
    if len(no_pool_gc) > 1 and len(with_pool_gc) > 1:
        print(f"✅ GC efficiency improvement: {gc_saving:.2f}%")
    print(f"✅ Average pool operation time: {avg_operation_time:.4f} ms")

    return {
        "no_pool": {
            "x": no_pool_x,
            "cpu": no_pool_cpu,
            "mem": no_pool_mem,
            "gc": no_pool_gc,
            "creation_time": avg_time_no_pool,
        },
        "with_pool": {
            "x": with_pool_x,
            "cpu": with_pool_cpu,
            "mem": with_pool_mem,
            "gc": with_pool_gc,
            "creation_time": avg_time_with_pool,
        },
        "stats": stats,
        "performance_gain": {
            "time_saving": time_saving,
            "gc_saving": gc_saving if "gc_saving" in locals() else 0,
        },
    }


def main():
    print("Fixed CPU and GC Performance Analysis Tool")
    print("=" * 40)

    # Run CPU/GC performance comparison
    _ = visualize_cpu_gc_comparison()

    print(
        "\nCPU/GC analysis complete! Please check the generated image file 'cpu_gc_performance_analysis.png'"
    )


if __name__ == "__main__":
    main()
