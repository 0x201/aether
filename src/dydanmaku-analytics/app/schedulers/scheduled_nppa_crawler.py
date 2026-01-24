from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
from app.services.nppa_game_audit_crawler import NPPAGameAuditCrawler
from app.deps import get_nppa_repository, session_connector


class ScheduledNPPACrawler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.crawler = NPPAGameAuditCrawler()

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
        self.scheduler.shutdown()
        logger.info("Scheduled crawler stopped")

    async def _daily_check(self):
        """Perform daily checks and operations"""
        with session_connector.get_session() as session:
            nppa_repo = get_nppa_repository(session)
            await self.crawler.run(nppa_repo, mode=1)