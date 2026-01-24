from .scheduled_nppa_crawler import ScheduledNPPACrawler
from .scheduled_danmaku_analyzer import ScheduledDanmakuAnalyzer

__all__ = ["ScheduledNPPACrawler", "ScheduledDanmakuAnalyzer"]


to_run_tasks = []


def _initialize_scheduled_tasks():
    """Initialize scheduled tasks."""
    global to_run_tasks
    to_run_tasks = [ScheduledNPPACrawler(), ScheduledDanmakuAnalyzer()]


def start_scheduled_tasks():
    """Start scheduled tasks."""
    _initialize_scheduled_tasks()
    global to_run_tasks
    for task in to_run_tasks:
        task.start()


def stop_scheduled_tasks():
    """Stop scheduled tasks."""
    global to_run_tasks
    for task in to_run_tasks:
        task.stop()
