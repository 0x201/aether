import json
import time
from collections import Counter
from datetime import UTC, datetime, timedelta

import jieba3
from loguru import logger
from sqlalchemy import and_, select

from src.cache import CacheSession
from src.database import Danmaku, DanmakuAnalysis, SessionFactory
from src.dataclass import PeriodType

from .analytics_notification import AnalyticsNotification

STOP_WORDS: set[str] = {
    " ",
    "\t",
    "\n",
    "，",
    "。",
    "！",
    "？",
    "；",
    "：",
    "、",
    "我",
    "你",
    "他",
    "她",
    "它",
    "我们",
    "你们",
    "他们",
    "她们",
    "它们",
    "自己",
    "本人",
    "他人",
    "人家",
    "谁",
    "哪儿",
    "哪里",
    "怎样",
    "多少",
    "如何",
    "什么",
    "哪个",
    "的",
    "了",
    "着",
    "过",
    "地",
    "得",
    "所",
    "似的",
    "在",
    "从",
    "向",
    "往",
    "朝",
    "沿着",
    "顺着",
    "比",
    "跟",
    "给",
    "替",
    "让",
    "被",
    "于",
    "由",
    "以",
    "把",
    "将",
    "对",
    "对于",
    "关于",
    "至于",
    "和",
    "跟",
    "与",
    "同",
    "及",
    "或",
    "以及",
    "不但",
    "不仅",
    "而且",
    "并且",
    "虽然",
    "但是",
    "然而",
    "不过",
    "可是",
    "只是",
    "如果",
    "假如",
    "只要",
    "一旦",
    "至于",
    "如果",
    "要是",
    "就",
    "便",
    "才",
    "则",
    "于是",
    "所以",
    "因此",
    "因为",
    "由于",
    "不",
    "没",
    "别",
    "莫",
    "休",
    "勿",
    "未",
    "否",
    "是否",
    "也许",
    "大概",
    "或许",
    "反正",
    "确实",
    "实在",
    "总之",
    "究竟",
    "到底",
    "难道",
    "居然",
    "竟然",
    "好",
    "行",
    "是",
    "有",
    "还",
    "也",
    "都",
    "又",
    "很",
    "挺",
    "怪",
    "蛮",
    "比较",
    "非常",
    "特别",
    "十分",
    "极其",
    "格外",
    "过于",
    "尤其",
    "相当",
    "稍微",
    "略微",
    "一",
    "一个",
    "两个",
    "一些",
    "几个",
    "一点",
    "几点",
    "几",
    "多少",
    "几许",
    "若干",
    "多少",
    "些许",
    "一丁点",
    "一点点",
    "一切",
    "所有",
    "全部",
    "完全",
    "整个",
    "全体",
    "统统",
    "通通",
    "全",
    "都",
    "均",
    "皆",
    "尽",
    "共",
    "总",
    "整",
    "双",
    "对",
    "两",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
    "这个",
    "那个",
    "这里",
    "那里",
    "这样",
    "那样",
    "这么",
    "那么",
    "这",
    "那",
    "这边",
    "那边",
    "这儿",
    "那儿",
    "如今",
    "当时",
    "现在",
    "过去",
    "将来",
    "今天",
    "明天",
    "昨天",
    "时候",
    "时候",
    "会",
    "能",
    "可",
    "可能",
    "可以",
    "应该",
    "应当",
    "要",
    "需要",
    "想",
    "希望",
    "愿意",
    "愿意",
    "愿意",
    "去",
    "来",
    "看",
    "看见",
    "看到",
    "听到",
    "听见",
    "觉得",
    "感觉",
    "感到",
    "感受",
    "知道",
    "了解",
    "明白",
    "清楚",
    "认为",
    "以为",
    "觉得",
    "看起来",
    "看起来",
}


class DanmakuAnalyzer:
    def __init__(
        self,
        session_factory: SessionFactory,
        notifier: AnalyticsNotification,
        cache_session: CacheSession,
    ) -> None:
        self.session_factory = session_factory
        self.notifier = notifier
        self.cache_session = cache_session

    @staticmethod
    def _generate_cache_key(
        key_prefix: str,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None,
    ) -> str:
        """
        Generate a consistent cache key following the specific format
        """
        date_format = "%Y_%m_%d_%H_%M_%S"
        room_id_str = str(room_id) if room_id is not None else "All"
        cache_key = (
            f"{key_prefix}:{start_time.strftime(date_format)}:{end_time.strftime(date_format)}:{room_id_str}"
        )
        return cache_key

    async def precompute_analyses(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None = None,
        period_type: PeriodType | None = None,
    ):
        """
        Precompute word frequency and wordcloud data for a time range in a single entry
        """

        if start_time > end_time:
            raise ValueError("start_time must be before end_time")

        # Generate both word frequency and wordcloud data
        await self.generate_analysis(
            start_time=start_time,
            end_time=end_time,
            top_n=100,
            room_id=room_id,
            period_type=period_type,
        )

        logger.info(
            f"Precomputed analyses for time range "
            f"{start_time} to {end_time} and room {room_id}"
        )

    def _validate_inputs(
        self,
        top_n: int,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None,
    ) -> None:
        """Validate input parameters for the analysis"""
        if top_n <= 0:
            raise ValueError("top_n must be a positive integer")

        if self.session_factory is None:
            raise ValueError("Database session_factory is required for analysis")

        if self.cache_session is None:
            raise ValueError("Cache session is required for analysis")

        if start_time > end_time:
            raise ValueError("start_time must be before end_time")

        if room_id is not None and room_id < 0:
            raise ValueError("room_id must be a positive integer")

    def _build_sql_statements(
        self, start_time: datetime, end_time: datetime, room_id: int | None
    ):
        """Build SQL statements for danmaku and analysis queries"""
        danmaku_stmt = select(Danmaku.content).where(
            and_(
                Danmaku.created_at >= start_time,
                Danmaku.created_at <= end_time,
                Danmaku.content.isnot(None),
            )
        )
        analysis_stmt = select(DanmakuAnalysis).where(
            and_(
                DanmakuAnalysis.start_time == start_time,
                DanmakuAnalysis.end_time == end_time,
                DanmakuAnalysis.type == "combined_analysis",
            )
        )

        if room_id:
            analysis_stmt = analysis_stmt.where(DanmakuAnalysis.room_id == room_id)
            danmaku_stmt = danmaku_stmt.where(Danmaku.room_id == room_id)

        return danmaku_stmt, analysis_stmt

    async def _check_cache_exists(self, cache_key: str) -> bool:
        """Check if analysis result exists in cache"""
        async with self.cache_session.get_cache() as cache:
            cached_analysis = await cache.get(cache_key)
            return bool(cached_analysis)

    async def _fetch_existing_analysis(
        self, transaction, analysis_stmt, cache_key: str
    ):
        """Fetch existing analysis from database and update cache if found"""
        existing_data = transaction.execute(analysis_stmt).scalar_one_or_none()

        if existing_data and existing_data.frequencies:
            # already computed
            # update cache
            await self._set_analysis_cache(cache_key, existing_data)
            return existing_data
        return None

    def _fetch_danmaku_content(self, transaction, danmaku_stmt, batch_size: int = 1000):
        """Fetch danmaku content from database in batches"""
        text_parts = []

        result = transaction.execute(danmaku_stmt)
        while True:
            chunk = result.fetchmany(batch_size)
            if not chunk:
                break
            for row in chunk:
                if row.content:
                    text_parts.append(row.content)

        return " ".join(text_parts)

    async def generate_analysis(
        self,
        start_time: datetime,
        end_time: datetime,
        top_n: int = 100,
        room_id: int | None = None,
        period_type: PeriodType | None = None,
    ) -> None:
        # Validate inputs
        self._validate_inputs(top_n, start_time, end_time, room_id)

        # Generate cache key
        analysis_cache_key = self._generate_cache_key(
            "danmaku_analysis", start_time, end_time, room_id
        )

        # Build SQL statements
        danmaku_stmt, analysis_stmt = self._build_sql_statements(
            start_time, end_time, room_id
        )

        # Check if result is already in cache
        if await self._check_cache_exists(analysis_cache_key):
            return

        with self.session_factory.transaction(autocommit=False) as transaction:
            # Check if analysis already exists in DB
            existing_data = await self._fetch_existing_analysis(
                transaction, analysis_stmt, analysis_cache_key
            )
            if existing_data:
                return

            # Fetch danmaku content
            text = self._fetch_danmaku_content(transaction, danmaku_stmt)

            # Perform the analysis
            danmaku_analysis = self._calculate_core(
                room_id=room_id,
                start_time=start_time,
                end_time=end_time,
                top_n=top_n,
                text=text,
            )

            # Store in cache and DB
            await self._set_analysis_cache(analysis_cache_key, danmaku_analysis)

            transaction.add(danmaku_analysis)
            transaction.commit()

            # Notify completion
            self._notify_completion(danmaku_analysis, room_id, period_type)

    def _notify_completion(
        self,
        danmaku_analysis: DanmakuAnalysis,
        room_id: int | None,
        period_type: PeriodType | None,
    ):
        """Notify that analysis is completed"""
        self.notifier.notify_analytics_completed(
            room_id=danmaku_analysis.room_id,
            start_date=danmaku_analysis.start_time.isoformat(),
            end_date=danmaku_analysis.end_time.isoformat(),
            period_type=(
                period_type.value if period_type else PeriodType.REALTIME.value
            ),
            frequencies_count=(
                len(danmaku_analysis.frequencies) if danmaku_analysis.frequencies else 0
            ),
            completed_at=danmaku_analysis.created_at.isoformat(),
        )

    async def precompute_for_all_rooms(
        self,
        period_type: PeriodType,
        start_time: datetime,
        end_time: datetime,
    ) -> None:
        # Precompute for overview statistics
        await self.precompute_analyses(
            start_time=start_time,
            end_time=end_time,
            period_type=period_type,
        )
        stmt = (
            select(Danmaku.room_id)
            .where(
                Danmaku.created_at >= datetime.now(UTC) - timedelta(hours=24),
                Danmaku.room_id.isnot(None),
            )
            .distinct()
        )
        with self.session_factory.query() as session:
            recent_rooms = session.execute(stmt).scalars().all()

        for room_result in recent_rooms:
            room_id = room_result
            try:
                await self.precompute_analyses(
                    start_time=start_time,
                    end_time=end_time,
                    room_id=room_id,
                    period_type=period_type,
                )
            except Exception as e:
                logger.error(f"Error precomputing analyses for room {room_id}: {e}")

    async def _set_analysis_cache(self, key: str, danmaku_analysis: DanmakuAnalysis):
        async with self.cache_session.get_cache() as cache:
            await cache.set(
                name=key,
                value=json.dumps(
                    {
                        "frequencies": danmaku_analysis.frequencies,
                        "type": danmaku_analysis.type,
                        "start_time": danmaku_analysis.start_time.isoformat(),
                        "end_time": danmaku_analysis.end_time.isoformat(),
                        "room_id": danmaku_analysis.room_id,
                    }
                ),
                ex=timedelta(hours=1),
            )

    def _calculate_core(
        self,
        room_id: int | None,
        start_time: datetime,
        end_time: datetime,
        top_n: int,
        text: str,
    ) -> DanmakuAnalysis:
        tokenizer = jieba3.jieba3()
        start = time.perf_counter()
        words = tokenizer.cut_text(text)
        logger.info(f"Tokenizing text for room {room_id or 'All'}")
        logger.info(f"Total text length: {len(text)}")

        filtered_words = [
            word for word in words if len(word) > 1 and word not in STOP_WORDS
        ]

        word_freq = Counter(filtered_words)
        word_frequency_result = word_freq.most_common(top_n)
        end = time.perf_counter()
        logger.info(
            f"Generated word frequency for time range {start_time} to {end_time}. Elaspsed time: {end - start:.6f}s"
        )

        danmaku_analysis = DanmakuAnalysis(
            type="combined_analysis",
            start_time=start_time,
            end_time=end_time,
            room_id=room_id,
            frequencies=json.dumps(word_frequency_result),
        )
        return danmaku_analysis
