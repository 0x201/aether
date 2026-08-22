from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from redis.asyncio import Redis

from app.core import AppConfig


class CacheSession:
    def __init__(self, app_config: AppConfig):
        self.host = app_config.cache.redis_host
        self.port = app_config.cache.redis_port
        self.password = app_config.cache.redis_password
        self.ssl = app_config.cache.ssl
        self.ssl_ca_certs = app_config.cache.ssl_ca_certs

    @asynccontextmanager
    async def get_cache(self) -> AsyncGenerator[Redis, None]:
        redis = Redis(
            host=self.host,
            port=self.port,
            password=self.password,
            ssl=self.ssl,
            ssl_ca_certs=self.ssl_ca_certs,
        )
        try:
            yield redis
        finally:
            await redis.close()
