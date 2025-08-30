import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import configure as configure_global_config, config
from config.app_config import AppConfig

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

app_config = AppConfig()
configure_global_config(app_config)

from src.api.api_v1.api import api_router

app = FastAPI(title="Fastapi Demo",
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


if __name__ == '__main__':
    uvicorn.run(app, host=app_config.api_config.host, port=app_config.api_config.port)
