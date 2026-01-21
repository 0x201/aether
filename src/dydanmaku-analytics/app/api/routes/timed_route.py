import time
from typing import Callable

from fastapi import Request, Response
from fastapi.routing import APIRoute
from loguru import logger


class TimedRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            before = time.time()
            response: Response = await original_route_handler(request)
            duration = (time.time() - before) * 1000
            (client_host, client_port) = (
                (request.client.host, request.client.port)
                if request.client
                else ("", "")
            )
            request_param = f"?{request.query_params}" if request.query_params else ""
            scheme = str(request.scope.get("scheme")).upper()
            version = request.scope.get("http_version")
            logger.info(
                f'{client_host}:{client_port} - "{request.method} {request.url.path}{request_param} {scheme}/{version}" {response.status_code} ({duration:.0f}ms)'
            )
            return response

        return custom_route_handler
