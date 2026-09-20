from fastapi import Request

from src.container import AppContainer


def get_container(request: Request) -> AppContainer:
    container = getattr(request.app.state, "container", None)
    if container is None:
        raise RuntimeError("AppContainer is not attached to app.state")
    return container
