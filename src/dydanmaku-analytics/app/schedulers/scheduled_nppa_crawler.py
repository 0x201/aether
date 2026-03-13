from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from app.services import NPPAGameAuditCrawler


class ScheduledNPPACrawler:
    def __init__(self, crawler: NPPAGameAuditCrawler):
        jobstores = {
            'default': MemoryJobStore()
        }
        executors = {
            'default': ThreadPoolExecutor(2), 
        }
        job_defaults = {
            'coalesce': False, 
            'max_instances': 1,  
            'misfire_grace_time': 30 
        }
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults
        )
        self.crawler = crawler

    async def _execute_daily_check(self):
        await self._daily_check()

    def start(self):
        """Start the scheduled analyzer"""
        # Schedule daily NPPA cralwer to run at 00:10 every day
        self.scheduler.add_job(
            self._execute_daily_check,
            CronTrigger(hour=0, minute=2),
            id="nppa_daily_check",
            name="NPPA daily check",
            replace_existing=True,
        )

        if not self.scheduler.running:
            self.scheduler.start()
        logger.info("Scheduled crawler started")

    def stop(self):
        """Stop the scheduled crawler"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown(wait=True)
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {e}")
        logger.info("Scheduled crawler stopped")

    async def _daily_check(self):
        """Perform daily checks and operations using dependency injection"""
        await self.crawler.run(mode=0)
