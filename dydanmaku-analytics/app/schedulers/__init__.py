from .scheduled_danmaku_analyzer import ScheduledDanmakuAnalyzer
from .scheduled_nppa_crawler import ScheduledNPPACrawler

__all__: list[str] = ["ScheduledNPPACrawler", "ScheduledDanmakuAnalyzer"]


to_run_tasks = []
container = None


def _initialize_scheduled_tasks():
    """Initialize scheduled tasks."""
    global to_run_tasks, container
    if container:
        scheduled_nppa_crawler = container.scheduled_nppa_crawler()
        scheduled_danmaku_analyzer = container.scheduled_danmaku_analyzer()
        to_run_tasks = [scheduled_nppa_crawler, scheduled_danmaku_analyzer]
    else:
        raise RuntimeError("Container not set. Call set_container first.")


def set_container(app_container):
    global container
    container = app_container


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
