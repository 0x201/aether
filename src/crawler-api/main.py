import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import get_scalar_api_reference
from config import configure as configure_global_config, config
from config.app_config import AppConfig

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

app_config = AppConfig()
configure_global_config(app_config)

from src.api.api_v1.api import api_router

app = FastAPI(title="Crawler App",
              openapi_url=f"{config.api_config.api_prefix}/{config.api_config.api_version}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_config.cors_allow_origins,
    allow_credentials=True,
    allow_methods=config.cors_config.cors_allow_methods,
    allow_headers=["*"],
)
app.include_router(api_router, prefix=f"{config.api_config.api_prefix}/{config.api_config.api_version}")


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
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            },
            "oauth2": {
                "type": "oauth2",
                "credentials": {
                    "password": {
                        "tokenUrl": f"{app_config.api_config.api_prefix}/{app_config.api_config.api_version}/access-token",
                        "scopes": {},
                    }
                }

            }
        }
    )


if __name__ == '__main__':
    uvicorn.run(app, host=app_config.api_config.host, port=app_config.api_config.port)