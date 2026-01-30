"""
Data analysis module for Douyu danmu
"""

import json
import time
from collections import Counter
from datetime import datetime, timedelta
from typing import LiteralString, Optional

import jieba3
from app.cache import CacheSession
from app.database import Danmaku, DanmakuAnalysis, SessionFactory
from app.dataclass import PeriodType
from .analytics_notification import AnalyticsNotification
from sqlalchemy import and_, select
from loguru import logger


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

    async def precompute_analyses(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: Optional[int] = None,
        period_type: Optional[PeriodType] = None,
    ):
        """Precompute word frequency and wordcloud data for a time range in a single entry"""
        # Generate both word frequency and wordcloud data
        await self.generate_analysis(
            start_time=start_time,
            end_time=end_time,
            top_n=100,
            room_id=room_id,
            perid_type=period_type,
        )

        logger.info(
            f"Precomputed analyses for time range {start_time} to {end_time} and room {room_id}"
        )

    async def generate_analysis(
        self,
        start_time: datetime,
        end_time: datetime,
        top_n: int = 100,
        room_id: Optional[int] = None,
        perid_type: Optional[PeriodType] = None,
    ):
        if top_n <= 0:
            raise ValueError("top_n must be a positive integer")

        if self.session_factory is None:
            raise ValueError("Database session_factory is required for analysis")

        if self.cache_session is None:
            raise ValueError("Cache session is required for analysis")

        analysis_cache_key = (
            f"danmaku_analysis:{start_time.isoformat()}:{end_time.isoformat()}:"
        )

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
            analysis_cache_key = f"{analysis_cache_key}{room_id}"
        else:
            analysis_cache_key = f"{analysis_cache_key}all"

        async with self.cache_session.get_cache() as cache:
            cached_analysis = await cache.get(analysis_cache_key)
            if cached_analysis:
                # already computed
                return

        with self.session_factory.get_transaction(autocommit=False) as transaction:
            existing_data = transaction.execute(analysis_stmt).scalar_one_or_none()

            if existing_data and existing_data.frequencies:
                # already computed
                # update cache
                await self._set_analysis_cache(analysis_cache_key, existing_data)
                return

            text_parts = []
            batch_size = 1000

            result = transaction.execute(danmaku_stmt)
            while True:
                chunk = result.fetchmany(batch_size)
                if not chunk:
                    break
                for row in chunk:
                    if row.content:
                        text_parts.append(row.content)

            text = " ".join(text_parts)
            danmaku_analysis = self._calculate_core(
                room_id=room_id,
                start_time=start_time,
                end_time=end_time,
                top_n=top_n,
                text=text,
            )

            await self._set_analysis_cache(analysis_cache_key, danmaku_analysis)

            transaction.add(danmaku_analysis)
            transaction.commit()

            self.notifier.notify_analytics_completed(
                room_id=danmaku_analysis.room_id,
                start_date=danmaku_analysis.start_time.isoformat(),
                end_date=danmaku_analysis.end_time.isoformat(),
                period_type=(
                    perid_type.value if perid_type else PeriodType.REALTIME.value
                ),
                frequencies_count=(
                    len(danmaku_analysis.frequencies)
                    if danmaku_analysis.frequencies
                    else 0
                ),
                completed_at=danmaku_analysis.created_at.isoformat(),
            )

    async def _set_analysis_cache(self, key: str, danmaku_analysis: DanmakuAnalysis):
        async with self.cache_session.get_cache() as cache:
            await cache.set(
                name=key,
                value=json.dumps(danmaku_analysis),
                ex=timedelta(hours=1),
            )

    def _calculate_core(
        self,
        room_id: Optional[int],
        start_time: datetime,
        end_time: datetime,
        top_n: int,
        text: LiteralString,
    ) -> DanmakuAnalysis:
        tokenizer = jieba3.jieba3()
        start = time.perf_counter()
        words = tokenizer.cut_text(text)
        logger.info(f"Tokenizing text for room {room_id or "All"}")
        logger.info(f"Total text length: {len(text)}")

        stop_words = {
            " ",
            "的",
            "了",
            "在",
            "是",
            "我",
            "有",
            "和",
            "就",
            "不",
            "人",
            "都",
            "一",
            "一个",
            "上",
            "也",
            "很",
            "到",
            "说",
            "要",
            "去",
            "你",
            "会",
            "着",
            "没有",
            "看",
            "好",
            "自己",
            "这",
        }

        filtered_words = [
            word for word in words if len(word) > 1 and word not in stop_words
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
