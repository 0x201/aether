from fastapi import FastAPI
import logging
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.logger import logger
from scalar_fastapi import get_scalar_api_reference
from config import config, configure as configure_global_config, AppConfig

configure_global_config(AppConfig())

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(module)s - %(funcName)s - line:%(lineno)d - %(levelname)s - %(message)s",
)
logger.setLevel(logging.INFO)

from src.api import create_api_router


def configure_app(app: FastAPI):
    app.openapi_url = (
        "/openapi.json"
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_config.cors_allow_origins,
        allow_credentials=True,
        allow_methods=config.cors_config.cors_allow_methods,
        allow_headers=["*"],
    )
    api_router = create_api_router()
    app.include_router(api_router, prefix=f"{config.api_config.api_prefix}")


app = FastAPI(
    title="Crawler App",
)

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": ENVIRONMENT}


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
        authentication={
            "preferredSecurityScheme": "oauth2",
            "securitySchemes": {
                "oauth2": {
                    "flow": {
                        "password": {
                            "username": "username",
                            "password": "password",
                            "tokenUrl": f"{config.api_config.api_prefix}/{config.api_config.api_version}/login/access-token",
                            "selectedScopes": [],
                        }
                    },
                    "x-default-scopes": ['profile', 'email', 'roles', 'permissions']
                },
            }
        },
        hide_client_button=True,
    )


if __name__ == "__main__":
    configure_app(app)
    logger.info(
        f"Starting API server at {config.api_config.host}:{config.api_config.port}"
    )
    uvicorn.run(app, host=config.api_config.host, port=config.api_config.port)
