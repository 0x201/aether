"""读用例（Query + Handler）。"""

from dataclasses import dataclass, field
from datetime import datetime

from src.domain.danmaku.repositories import DanmakuRepository
from src.domain.danmaku.services import WordFrequencyDomainService

from .dtos import (
    DanmakuPageDto,
    DanmakuStatisticsDto,
    WordcloudResultDto,
    WordFrequencyResultDto,
)
from .mappers import to_danmaku_with_room_dto, to_word_frequency_dto
from .services import DanmakuAnalyzer


@dataclass(frozen=True, slots=True)
class ListDanmakuQuery:
    """分页检索弹幕。"""

    page: int = 1
    page_size: int = 20
    keyword: str | None = None
    room_id: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    user_name: str | None = None
    user_level_min: int | None = None
    user_level_max: int | None = None
    fan_medal_level_min: int | None = None
    fan_medal_level_max: int | None = None
    fan_medal_name: str | None = None
    sort: str | None = None


@dataclass(frozen=True, slots=True)
class GetDanmakuStatisticsQuery:
    """弹幕总览统计。"""

    room_id: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None


@dataclass(frozen=True, slots=True)
class GetWordFrequencyQuery:
    """词频 Top-N。"""

    start_time: datetime
    end_time: datetime
    room_id: int | None = None
    top_n: int = field(default=WordFrequencyDomainService.DEFAULT_TOP_N)


@dataclass(frozen=True, slots=True)
class GetWordcloudQuery:
    """词云数据。"""

    start_time: datetime
    end_time: datetime
    room_id: int | None = None


class ListDanmakuHandler:
    def __init__(self, repository: DanmakuRepository) -> None:
        self._repository = repository

    def handle(self, query: ListDanmakuQuery) -> DanmakuPageDto:
        page = max(query.page, 1)
        page_size = max(query.page_size, 1)
        offset = (page - 1) * page_size

        rows = self._repository.search(
            user_name=query.user_name,
            room_id=query.room_id,
            start_time=query.start_time,
            end_time=query.end_time,
            user_level_min=query.user_level_min,
            user_level_max=query.user_level_max,
            fan_medal_level_min=query.fan_medal_level_min,
            fan_medal_level_max=query.fan_medal_level_max,
            fan_medal_name=query.fan_medal_name,
            keyword=query.keyword,
            limit=page_size,
            offset=offset,
            sort=query.sort,
        )
        total = self._repository.count_search(
            user_name=query.user_name,
            room_id=query.room_id,
            start_time=query.start_time,
            end_time=query.end_time,
            user_level_min=query.user_level_min,
            user_level_max=query.user_level_max,
            fan_medal_level_min=query.fan_medal_level_min,
            fan_medal_level_max=query.fan_medal_level_max,
            fan_medal_name=query.fan_medal_name,
            keyword=query.keyword,
        )
        return DanmakuPageDto(
            items=[to_danmaku_with_room_dto(row) for row in rows],
            total=total,
        )


class GetDanmakuStatisticsHandler:
    def __init__(self, repository: DanmakuRepository) -> None:
        self._repository = repository

    def handle(self, query: GetDanmakuStatisticsQuery) -> DanmakuStatisticsDto:
        return DanmakuStatisticsDto(
            total_messages=self._repository.count(
                room_id=query.room_id,
                start_time=query.start_time,
                end_time=query.end_time,
            ),
            unique_users=self._repository.count_unique_users(
                room_id=query.room_id,
                start_time=query.start_time,
                end_time=query.end_time,
            ),
            active_rooms=self._repository.count_active_rooms(
                start_time=query.start_time,
                end_time=query.end_time,
            ),
            peak_hour=self._repository.get_peak_hour(
                room_id=query.room_id,
                start_time=query.start_time,
                end_time=query.end_time,
            ),
        )


class GetWordFrequencyHandler:
    def __init__(self, analyzer: DanmakuAnalyzer) -> None:
        self._analyzer = analyzer

    async def handle(self, query: GetWordFrequencyQuery) -> WordFrequencyResultDto:
        frequencies = await self._analyzer.get_word_frequency(
            start_time=query.start_time,
            end_time=query.end_time,
            top_n=query.top_n,
            room_id=query.room_id,
        )
        return WordFrequencyResultDto(
            room_id=query.room_id,
            start_time=query.start_time,
            end_time=query.end_time,
            frequencies=[to_word_frequency_dto(item) for item in frequencies],
        )


class GetWordcloudHandler:
    def __init__(self, analyzer: DanmakuAnalyzer) -> None:
        self._analyzer = analyzer

    async def handle(self, query: GetWordcloudQuery) -> WordcloudResultDto:
        words = await self._analyzer.get_wordcloud(
            start_time=query.start_time,
            end_time=query.end_time,
            room_id=query.room_id,
        )
        dtos = [to_word_frequency_dto(item) for item in words]
        return WordcloudResultDto(
            room_id=query.room_id,
            start_time=query.start_time,
            end_time=query.end_time,
            words=dtos,
            max_count=max((item.count for item in dtos), default=0),
        )
