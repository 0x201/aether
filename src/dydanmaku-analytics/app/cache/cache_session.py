from contextlib import asynccontextmanager
from typing import AsyncGenerator

from redis.asyncio import Redis

from app.core import settings


class CacheSession:
    def __init__(self):
        self.host = settings.cache.redis_host
        self.port = settings.cache.redis_port
        self.password = settings.cache.redis_password
        self.ssl = settings.cache.ssl
        self.ssl_ca_certs = settings.cache.ssl_ca_certs

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
