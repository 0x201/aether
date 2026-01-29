from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator
from redis.asyncio import Redis
from app.core import settings


class CacheSession:
    def __init__(self):
        self.host = settings.cache.host
        self.port = settings.cache.port
        self.password = settings.cache.password
        self.ssl = settings.cache.ssl
        self.ssl_certfile = settings.cache.ssl_certfile
        self.ssl_keyfile = settings.cache.ssl_keyfile
        self.ssl_ca_certs = settings.cache.ssl_ca_certs

    @asynccontextmanager
    async def get_cache(self) -> AsyncGenerator[Redis, None]:
        redis = Redis(
            host=self.host,
            port=self.port,
            password=self.password,
            ssl=self.ssl,
            ssl_certfile=self.ssl_certfile,
            ssl_keyfile=self.ssl_keyfile,
            ssl_ca_certs=self.ssl_ca_certs,
        )
        try:
            yield redis
        finally:
            await redis.close()
