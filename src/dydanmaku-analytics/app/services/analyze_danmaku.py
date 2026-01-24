"""
Data analysis module for Douyu danmu
"""

import json
import time
from collections import Counter
from datetime import datetime
from typing import Optional

import jieba3
from app.database import Danmaku, DanmakuAnalysis, SessionFactory
from app.dataclass import DanmakuAnalysisDto
from sqlalchemy import and_, select
from loguru import logger


class DanmakuAnalyzer:
    def __init__(self, session_factory: SessionFactory) -> None:
        self.session_factory = session_factory

    def precompute_analyses(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: Optional[int] = None,
    ) -> DanmakuAnalysisDto:
        """Precompute word frequency and wordcloud data for a time range in a single entry"""
        # Generate both word frequency and wordcloud data
        analysis = self.generate_analysis(
            top_n=100,
            start_time=start_time,
            end_time=end_time,
            room_id=room_id,
        )

        logger.info(
            f"Precomputed analyses for time range {start_time} to {end_time} and room {room_id}"
        )
        dto = DanmakuAnalysisDto(
            startDate=start_time,
            endDate=end_time,
            roomId=room_id,
            frequenciesCount=len(analysis.frequencies) if analysis.frequencies else 0,
            periodType="",
            createdAt=analysis.created_at,
        )
        return dto

    def generate_analysis(
        self,
        top_n: int = 100,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        room_id: Optional[int] = None,
    ) -> DanmakuAnalysis:
        """Generate word frequency and wordcloud analysis with optional time filtering"""
        # This method should not be called without a db session
        if self.session_factory is None:
            raise ValueError("Database session_factory is required for analysis")

        with self.session_factory.get_transaction(autocommit=False) as transaction:
            # Directly check for cached data in the database
            if start_time and end_time:
                stmt = select(DanmakuAnalysis).where(
                    and_(
                        DanmakuAnalysis.start_time == start_time,
                        DanmakuAnalysis.end_time == end_time,
                        DanmakuAnalysis.type == "combined_analysis",
                        DanmakuAnalysis.room_id == room_id,
                    )
                )

                existing_data = transaction.execute(stmt).scalar_one_or_none()

                if existing_data and existing_data.frequencies:
                    return existing_data

            # Build query with time and room filters
            query = select(Danmaku.content).where(Danmaku.content.isnot(None))

            if start_time:
                query = query.where(Danmaku.created_at >= start_time)
            if end_time:
                query = query.where(Danmaku.created_at <= end_time)
            if room_id:
                query = query.where(Danmaku.room_id == room_id)

            # Use streaming to avoid loading all data into memory at once for word frequency
            text_parts = []
            batch_size = 1000

            # Execute the query and fetch results in chunks to avoid locks
            result = transaction.execute(query)
            while True:
                chunk = result.fetchmany(batch_size)
                if not chunk:
                    break
                # Process the chunk
                for row in chunk:
                    if row.content:
                        text_parts.append(row.content)

            # Combine all content
            text = " ".join(text_parts)

            # Use jieba3 to segment Chinese text
            tokenizer = jieba3.jieba3()

            logger.info(f"Tokenizing text for room {room_id}")
            logger.info(f"Total text length: {len(text)}")
            start = time.perf_counter()
            words = tokenizer.cut_text(text)

            # Filter out single characters and common stop words
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

            # Count word frequency
            word_freq = Counter(filtered_words)
            word_frequency_result = word_freq.most_common(top_n)
            end = time.perf_counter()
            logger.info(
                f"Generated word frequency for time range {start_time} to {end_time}. Elaspsped time: {end - start:.6f}s"
            )

            danmaku_analysis = DanmakuAnalysis(
                type="combined_analysis",
                start_time=start_time,
                end_time=end_time,
                room_id=room_id,
                frequencies=json.dumps(word_frequency_result),
            )

            transaction.add(danmaku_analysis)
            transaction.commit()
            return danmaku_analysis
