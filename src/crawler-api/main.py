from fastapi import FastAPI
import logging
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.logger import logger
from fastapi.openapi.utils import get_openapi
from scalar_fastapi import get_scalar_api_reference
from config import config
from src.middleware.keycloak_middleware import KeycloakMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(module)s - %(funcName)s - line:%(lineno)d - %(levelname)s - %(message)s",
)
logger.setLevel(logging.INFO)

from src.api import create_api_router

# Configure Keycloak settings
keycloak_config = config.app_config.keycloak_config

app = FastAPI(
    title="Crawler App",
    description="Crawler App API",
    version="0.0.1",
    openapi_tags=[{"name": "Crawler App API", "description": ""}],
)

# Add Keycloak middleware for authentication
app.add_middleware(KeycloakMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.app_config.cors_config.cors_allow_origins,
    allow_credentials=True,
    allow_methods=config.app_config.cors_config.cors_allow_methods,
    allow_headers=["*"],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
        
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
    )
    
    # Add OAuth2 security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "authorizationCode": {
                    "authorizationUrl": f"{keycloak_config.server_url}realms/{keycloak_config.realm}/protocol/openid-connect/auth",
                    "tokenUrl": f"{keycloak_config.server_url}realms/{keycloak_config.realm}/protocol/openid-connect/token",
                    "refreshUrl": f"{keycloak_config.server_url}realms/{keycloak_config.realm}/protocol/openid-connect/token",
                    "x-scalar-client-id": keycloak_config.client_id,
                    "clientSecret": keycloak_config.client_secret
                }
            }
        }
    }
    
    # Set default security requirement
    openapi_schema["security"] = [
        {
            "OAuth2PasswordBearer": ["openid", "profile", "email", "roles"]
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": ENVIRONMENT}


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
        hide_client_button=True,
    )


api_router = create_api_router()
app.include_router(api_router, prefix=f"{config.app_config.api_config.api_prefix}")

if __name__ == "__main__":
    uvicorn.run(
        app=app,
        host=config.app_config.api_config.host,
        port=config.app_config.api_config.port,
    )