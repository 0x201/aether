import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router
from config import config

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

app = FastAPI(title="Fastapi Demo", openapi_url=f"{config.api_base_url}/{config.api_version}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=f"{config.api_base_url}/{config.api_version}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": ENVIRONMENT }

if __name__ == '__main__':
    uvicorn.run(app, host=config.host, port=config.port)