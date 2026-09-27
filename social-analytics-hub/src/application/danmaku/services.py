"""应用层服务：用例编排、缓存与集成事件发布。不依赖 Web 框架。"""

import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Protocol

from loguru import logger

from src.domain.danmaku.entities import DanmakuAnalysisEntity
from src.domain.danmaku.events import DanmakuAnalysisCompletedDomainEvent
from src.domain.danmaku.repositories import (
    DanmakuAnalysisRepository,
    DanmakuRepository,
)
from src.domain.danmaku.services import WordFrequency, WordFrequencyDomainService
from src.domain.danmaku.value_objects import (
    AnalysisPeriod,
    AnalysisType,
    TimeRange,
)

from .dtos import DanmakuAnalysisDto
from .mappers import to_danmaku_analysis_dto


class CacheClientPort(Protocol):
    """应用层所需的缓存客户端能力。"""

    async def get(self, key: str) -> bytes | str | None: ...

    async def set(
        self, key: str, value: str, ex: timedelta | None = None
    ) -> object: ...

    async def delete(self, key: str) -> object: ...


class CachePort(Protocol):
    """应用层所需的缓存会话能力（由基础设施层实现）。"""

    def get_cache(self) -> AsyncIterator[CacheClientPort]: ...


class EventBusPort(Protocol):
    """应用层所需的集成事件发布能力（由基础设施层实现）。"""

    def publish(self, event_type_name: str, event_data: dict[str, object]) -> bool: ...


INTEGRATION_EVENT_ANALYTICS_COMPLETED = "AnalyticsCompletedIntegrationEvent"

#: 触发分析时单次从仓储拉取的弹幕条数
CONTENT_BATCH_SIZE = 1000

#: 分析结果缓存有效期
ANALYSIS_CACHE_TTL = timedelta(hours=1)


class CacheUnavailableError(RuntimeError):
    """缓存不可用（连接失败或操作超时）。

    归属于应用层：由基础设施层的缓存适配器抛出，应用层捕获后把缓存降级为
    "未命中"。缓存只是加速手段，不应让请求失败。
    """


class AnalyticsNotificationService:
    """把领域事件转换为集成事件并发布到消息总线。"""

    def __init__(self, event_bus: EventBusPort) -> None:
        self.event_bus = event_bus

    def notify_analytics_completed(
        self,
        room_id: int | None,
        start_date: str,
        end_date: str,
        period_type: str,
        frequencies_count: int,
        completed_at: str,
    ) -> bool:
        event_data: dict[str, object] = {
            "roomId": room_id,
            "startDate": start_date,
            "endDate": end_date,
            "periodType": period_type,
            "frequenciesCount": frequencies_count,
            "completedAt": completed_at,
        }
        return self._publish(event_data, room_id)

    def notify_event(self, event: DanmakuAnalysisCompletedDomainEvent) -> bool:
        """发布领域事件对应的集成事件。"""
        return self._publish(event.to_integration_payload(), event.room_id)

    def _publish(self, payload: dict[str, object], room_id: int | None) -> bool:
        success = self.event_bus.publish(INTEGRATION_EVENT_ANALYTICS_COMPLETED, payload)
        if success:
            logger.info(f"Analytics completion notification sent for room {room_id}")
        else:
            logger.error(
                f"Failed to send analytics completion notification for room {room_id}"
            )
        return success


class DanmakuAnalyzer:
    """弹幕词频分析用例编排。"""

    def __init__(
        self,
        danmaku_repo: DanmakuRepository,
        analysis_repo: DanmakuAnalysisRepository,
        notifier: AnalyticsNotificationService,
        cache_session: CachePort,
        frequency_service: WordFrequencyDomainService,
    ) -> None:
        self.danmaku_repo = danmaku_repo
        self.analysis_repo = analysis_repo
        self.notifier = notifier
        self.cache_session = cache_session
        self.frequency_service = frequency_service

    # ==================================================
    # Public API
    # ==================================================
    async def precompute_analyses(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None = None,
        period_type: AnalysisPeriod | None = None,
        top_n: int = WordFrequencyDomainService.DEFAULT_TOP_N,
    ) -> DanmakuAnalysisDto:
        time_range = TimeRange.of(start_time, end_time)
        dto = await self.generate_analysis(
            start_time=time_range.start,
            end_time=time_range.end,
            top_n=top_n,
            room_id=room_id,
            period_type=period_type,
        )
        logger.info(
            f"Precomputed analyses for time range {time_range.start} to "
            f"{time_range.end} and room {room_id}"
        )
        return dto

    async def generate_analysis(
        self,
        start_time: datetime,
        end_time: datetime,
        top_n: int = WordFrequencyDomainService.DEFAULT_TOP_N,
        room_id: int | None = None,
        period_type: AnalysisPeriod | None = None,
    ) -> DanmakuAnalysisDto:
        """生成并持久化词频分析；命中缓存或已有结果时直接复用。"""
        time_range = TimeRange.of(start_time, end_time)
        self._validate_inputs(top_n, time_range.start, time_range.end, room_id)

        period = self._period_of(period_type)
        analysis_type = AnalysisType.COMBINED.value
        cache_key = self._generate_cache_key(
            "danmaku_analysis", time_range.start, time_range.end, room_id
        )

        if await self._check_cache_exists(cache_key):
            logger.info(f"Analysis cache hit for key {cache_key}")
            return await self._load_cached(cache_key)

        existing = self._fetch_existing_analysis(time_range, analysis_type, room_id)
        if existing is not None:
            dto = to_danmaku_analysis_dto(existing, period)
            await self._set_analysis_cache(cache_key, dto)
            return dto

        text = self._fetch_danmaku_content(time_range, room_id)
        frequencies = self.frequency_service.top_words(text, top_n=top_n)

        entity = DanmakuAnalysisEntity(
            id=None,
            room_id=room_id,
            start_time=time_range.start,
            end_time=time_range.end,
            type=analysis_type,
            frequencies=self._dump_frequencies(frequencies),
            created_at=datetime.now(UTC),
        )
        stored = self.analysis_repo.add(entity)

        dto = to_danmaku_analysis_dto(stored, period)
        await self._set_analysis_cache(cache_key, dto)
        self._notify_completion(dto)
        return dto

    async def precompute_for_all_rooms(
        self,
        period_type: AnalysisPeriod,
        start_time: datetime,
        end_time: datetime,
        top_n: int = WordFrequencyDomainService.DEFAULT_TOP_N,
    ) -> int:
        """为全局与每个活跃房间生成分析，返回成功分析的房间数。"""
        await self.precompute_analyses(
            start_time=start_time,
            end_time=end_time,
            period_type=period_type,
            top_n=top_n,
        )

        analysed_rooms = 0
        for room_id in self.danmaku_repo.get_recent_room_ids():
            try:
                await self.precompute_analyses(
                    start_time=start_time,
                    end_time=end_time,
                    room_id=room_id,
                    period_type=period_type,
                    top_n=top_n,
                )
                analysed_rooms += 1
            except Exception:
                logger.exception(f"Error precomputing analyses for room {room_id}")

        return analysed_rooms

    async def get_word_frequency(
        self,
        start_time: datetime,
        end_time: datetime,
        top_n: int = WordFrequencyDomainService.DEFAULT_TOP_N,
        room_id: int | None = None,
    ) -> list[WordFrequency]:
        """读取词频：缓存 → 已持久化分析 → 实时计算。"""
        time_range = TimeRange.of(start_time, end_time)
        self._validate_inputs(top_n, time_range.start, time_range.end, room_id)

        cache_key = self._generate_cache_key(
            "danmaku_analysis", time_range.start, time_range.end, room_id
        )
        if await self._check_cache_exists(cache_key):
            return self._to_word_frequencies(
                await self._load_cached_frequencies(cache_key)
            )

        existing = self._fetch_existing_analysis(
            time_range, AnalysisType.COMBINED.value, room_id
        )
        if existing is not None:
            return self._to_word_frequencies(
                self._parse_frequencies(existing.frequencies)
            )

        text = self._fetch_danmaku_content(time_range, room_id)
        return self.frequency_service.top_words(text, top_n=top_n)

    async def get_wordcloud(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None = None,
    ) -> list[WordFrequency]:
        """词云数据：复用词频结果并按词云 Top-N 截断。"""
        frequencies = await self.get_word_frequency(
            start_time=start_time,
            end_time=end_time,
            top_n=WordFrequencyDomainService.DEFAULT_WORDCLOUD_TOP_N,
            room_id=room_id,
        )
        return frequencies

    # ==================================================
    # Internals
    # ==================================================
    @staticmethod
    def _generate_cache_key(
        key_prefix: str,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None,
    ) -> str:
        date_format = "%Y_%m_%d_%H_%M_%S"
        room_id_str = str(room_id) if room_id is not None else "All"
        return (
            f"{key_prefix}:"
            f"{start_time.strftime(date_format)}:"
            f"{end_time.strftime(date_format)}:"
            f"{room_id_str}"
        )

    @staticmethod
    def _period_of(period_type: AnalysisPeriod | None) -> AnalysisPeriod:
        return period_type or AnalysisPeriod.REALTIME

    @staticmethod
    def _validate_inputs(
        top_n: int,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None,
    ) -> None:
        if top_n <= 0:
            raise ValueError("top_n must be a positive integer")
        if start_time > end_time:
            raise ValueError("start must be before end_time")
        if room_id is not None and room_id < 0:
            raise ValueError("room_id must be a positive integer")

    @staticmethod
    def _dump_frequencies(frequencies: list[WordFrequency]) -> str:
        return json.dumps(
            [[item.word, item.count] for item in frequencies], ensure_ascii=False
        )

    @staticmethod
    def _parse_frequencies(frequencies: str | None) -> list[list]:
        """解析持久化的词频载荷；兼容 `[[word, count], ...]` 与 `{word: count}`。"""
        if not frequencies:
            return []
        try:
            payload = json.loads(frequencies)
        except TypeError, ValueError:
            logger.warning("Malformed frequencies payload, returning empty result")
            return []
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            return [[word, count] for word, count in payload.items()]
        return []

    @staticmethod
    def _to_word_frequencies(payload: list[list]) -> list[WordFrequency]:
        result: list[WordFrequency] = []
        for item in payload:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                result.append(WordFrequency(word=str(item[0]), count=int(item[1])))
        return result

    async def _check_cache_exists(self, cache_key: str) -> bool:
        try:
            async with self.cache_session.get_cache() as cache:
                return bool(await cache.get(cache_key))
        except CacheUnavailableError as error:
            self._log_cache_degraded("read", error)
            return False

    async def _load_cached(self, cache_key: str) -> DanmakuAnalysisDto:
        payload = await self._read_cache(cache_key)
        return DanmakuAnalysisDto(
            room_id=payload.get("room_id"),
            start_time=datetime.fromisoformat(payload["start_time"]),
            end_time=datetime.fromisoformat(payload["end_time"]),
            period_type=AnalysisPeriod(
                payload.get("period_type", AnalysisPeriod.REALTIME.value)
            ),
            frequencies=payload.get("frequencies"),
            frequencies_count=len(self._parse_frequencies(payload.get("frequencies"))),
            type=payload.get("type", AnalysisType.COMBINED.value),
            created_at=datetime.fromisoformat(
                payload.get("created_at", payload["start_time"])
            ),
        )

    async def _load_cached_frequencies(self, cache_key: str) -> list[list]:
        payload = await self._read_cache(cache_key)
        return self._parse_frequencies(payload.get("frequencies"))

    async def _read_cache(self, cache_key: str) -> dict:
        try:
            async with self.cache_session.get_cache() as cache:
                raw = await cache.get(cache_key)
        except CacheUnavailableError as error:
            self._log_cache_degraded("read", error)
            return {}
        if raw is None:
            return {}
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        try:
            return json.loads(raw)
        except TypeError, ValueError:
            logger.warning(f"Malformed cache payload at key {cache_key}")
            return {}

    def _fetch_existing_analysis(
        self,
        time_range: TimeRange,
        analysis_type: str,
        room_id: int | None,
    ) -> DanmakuAnalysisEntity | None:
        existing = self.analysis_repo.get_analysis(
            start_time=time_range.start,
            end_time=time_range.end,
            type=analysis_type,
            room_id=room_id,
        )
        if existing is not None and existing.has_frequencies():
            return existing
        return None

    def _fetch_danmaku_content(
        self,
        time_range: TimeRange,
        room_id: int | None = None,
        batch_size: int = CONTENT_BATCH_SIZE,
    ) -> str:
        """按批次拉取区间内弹幕文本。

        使用 offset 翻页推进，避免"每批都从头取"导致的死循环。
        """
        text_parts: list[str] = []
        offset = 0

        while True:
            chunk = self.danmaku_repo.get_recent(
                start_time=time_range.start,
                end_time=time_range.end,
                room_id=room_id,
                limit=batch_size,
                offset=offset,
            )
            if not chunk:
                break
            text_parts.extend(row.content for row in chunk if row.content)
            if len(chunk) < batch_size:
                break
            offset += batch_size

        return " ".join(text_parts)

    def _notify_completion(self, dto: DanmakuAnalysisDto) -> None:
        event = DanmakuAnalysisCompletedDomainEvent(
            room_id=dto.room_id,
            start_time=dto.start_time,
            end_time=dto.end_time,
            analysis_type=AnalysisType.COMBINED,
            period=dto.period_type,
            frequencies_count=dto.frequencies_count,
            completed_at=dto.created_at,
        )
        self.notifier.notify_event(event)

    async def _set_analysis_cache(
        self, key: str, danmaku_analysis: DanmakuAnalysisDto
    ) -> None:
        payload = json.dumps(
            {
                "frequencies": danmaku_analysis.frequencies,
                "type": danmaku_analysis.type,
                "start_time": danmaku_analysis.start_time.isoformat(),
                "end_time": danmaku_analysis.end_time.isoformat(),
                "created_at": danmaku_analysis.created_at.isoformat(),
                "period_type": danmaku_analysis.period_type.value,
                "room_id": danmaku_analysis.room_id,
            }
        )
        try:
            async with self.cache_session.get_cache() as cache:
                await cache.set(key, payload, ex=ANALYSIS_CACHE_TTL)
        except CacheUnavailableError as error:
            # 缓存写失败不影响已持久化的分析结果
            self._log_cache_degraded("write", error)

    @staticmethod
    def _log_cache_degraded(operation: str, error: Exception) -> None:
        logger.warning(f"Cache {operation} degraded to no-op: {error}")
