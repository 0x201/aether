"""
Data analysis module for Douyu danmu
"""

import json
import time
from collections import Counter
from datetime import datetime
from typing import Optional

import jieba3
from app.database.models import Danmaku, DanmakuAnalysis
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from loguru import logger


class DanmakuAnalyzer:
    def precompute_analyses(
        self,
        session: Session,
        start_time: datetime,
        end_time: datetime,
        room_id: Optional[int] = None,
    ):
        """Precompute word frequency and wordcloud data for a time range in a single entry"""
        # Generate both word frequency and wordcloud data
        _ = self.generate_analysis(
            top_n=100,
            session=session,
            start_time=start_time,
            end_time=end_time,
            room_id=room_id,
        )

        logger.info(
            f"Precomputed analyses for time range {start_time} to {end_time} and room {room_id}"
        )

    def generate_analysis(
        self,
        top_n: int = 100,
        session: Optional[Session] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        room_id: Optional[int] = None,
    ) -> DanmakuAnalysis:
        """Generate word frequency and wordcloud analysis with optional time filtering"""
        # This method should not be called without a db session
        if session is None:
            raise ValueError("Database session is required for analysis")

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
            existing_data = session.execute(stmt).scalar_one_or_none()

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
        result = session.execute(query)
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
        logger.info(f"Generated word frequency for time range {start_time} to {end_time}. Elaspsped time: {end - start:.6f}s")

        danmaku_analysis = DanmakuAnalysis(
            type="combined_analysis",
            start_time=start_time,
            end_time=end_time,
            room_id=room_id,
            frequencies=json.dumps(word_frequency_result),
        )

        session.add(danmaku_analysis)
        session.commit()

        return danmaku_analysis
