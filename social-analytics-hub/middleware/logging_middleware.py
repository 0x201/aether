import time
from loguru import logger
from uuid import uuid8
from starlette.middleware.base import BaseHTTPMiddleware


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request, call_next):

        request_id = str(uuid8())
        method = request.method
        endpoint = request.url.path

        with logger.contextualize(
            request_id=request_id,
            method=method,
            endpoint=endpoint,
            user_agent=request.headers.get("user-agent"),
            referer=request.headers.get("referer"),
            origin=request.headers.get("origin"),
            x_forwarded_for=request.headers.get("x-forwarded-for"),
            x_real_ip=request.headers.get("x-real-ip"),
        ):
            logger.info(f"[{method}] [{endpoint}]")
            start = time.perf_counter()
            response = await call_next(request)

            elapsed_ms = round((time.perf_counter() - start) * 1000)
            status_code = response.status_code

            msg = f"[{method}] [{endpoint}] [{status_code}] [{elapsed_ms}ms]"
            if status_code >= 500:
                logger.error(msg)
            elif status_code >= 400:
                logger.warning(msg)
            else:
                logger.info(msg)

            return response
