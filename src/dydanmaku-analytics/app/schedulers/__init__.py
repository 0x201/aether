from .scheduled_crawler import ScheduledNPPACrawler
from .scheduled_analyzer import ScheduledAnalyzer

__all__ = ["ScheduledNPPACrawler", "ScheduledAnalyzer"]


to_run_tasks = []


def _initialize_scheduled_tasks():
    """Initialize scheduled tasks."""
    global to_run_tasks
    to_run_tasks = [ScheduledNPPACrawler(), ScheduledAnalyzer()]


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
