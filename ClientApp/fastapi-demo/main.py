import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router
from appsettings import appsettings

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

app = FastAPI(title="Fastapi Demo", openapi_url=f"{appsettings.API_BASE_URL}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=appsettings.ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=appsettings.API_BASE_URL)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": ENVIRONMENT }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=appsettings.HOST, port=appsettings.PORT)