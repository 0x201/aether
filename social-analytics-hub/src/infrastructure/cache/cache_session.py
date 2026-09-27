"""Redis 缓存适配。

两个关键设计：

1. **操作级超时**：`redis-py` 在当前接口下并不总是遵守
   `socket_connect_timeout`（实测对端拒绝连接也要 25s 才返回），因此这里用
   `asyncio.timeout` 再包一层，保证缓存慢/不可用时请求能快速失败。
2. **缓存降级**：缓存只是加速手段，不是强依赖。超时/连接失败统一抛出
   `CacheUnavailableError`，由应用层捕获并退化为"缓存未命中"。
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Any

from redis.asyncio import Redis

from src.application.danmaku.services import CacheUnavailableError
from src.core import AppConfig


class CacheClient:
    """带操作超时的缓存客户端。

    只暴露应用层需要的能力（get/set/delete），并把超时与连接错误统一转换
    为应用层定义的 `CacheUnavailableError`。
    """

    def __init__(self, redis: Redis, operation_timeout: float) -> None:
        self._redis = redis
        self._operation_timeout = operation_timeout

    async def get(self, key: str) -> bytes | str | None:
        return await self._run("get", self._redis.get(key))

    async def set(self, key: str, value: str, ex: timedelta | None = None) -> Any:
        return await self._run("set", self._redis.set(key, value, ex=ex))

    async def delete(self, key: str) -> Any:
        return await self._run("delete", self._redis.delete(key))

    async def _run(self, operation: str, awaitable: Any) -> Any:
        try:
            async with asyncio.timeout(self._operation_timeout):
                return await awaitable
        except TimeoutError as error:
            raise CacheUnavailableError(
                f"cache {operation} timed out after {self._operation_timeout}s"
            ) from error
        except OSError as error:
            raise CacheUnavailableError(f"cache {operation} failed: {error}") from error


class CacheSession:
    def __init__(self, app_config: AppConfig) -> None:
        self.host = app_config.cache.redis_host
        self.port = app_config.cache.redis_port
        self.password = app_config.cache.redis_password
        self.ssl = app_config.cache.ssl
        self.ssl_ca_certs = app_config.cache.ssl_ca_certs
        self.socket_connect_timeout = app_config.cache.socket_connect_timeout
        self.socket_timeout = app_config.cache.socket_timeout
        self.operation_timeout = app_config.cache.operation_timeout

    @asynccontextmanager
    async def get_cache(self) -> AsyncGenerator[CacheClient]:
        redis = Redis(
            host=self.host,
            port=self.port,
            password=self.password,
            ssl=self.ssl,
            ssl_ca_certs=self.ssl_ca_certs,
            socket_connect_timeout=self.socket_connect_timeout,
            socket_timeout=self.socket_timeout,
        )
        try:
            yield CacheClient(redis=redis, operation_timeout=self.operation_timeout)
        finally:
            await redis.aclose()
