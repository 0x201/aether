from fastapi import APIRouter, Depends
from src.api.deps import get_current_user
from src.api.auth import require_auth

router = APIRouter()


@router.get("/me", summary="Get current user", 
    description="Get information about the current authenticated user from Keycloak token")
async def read_user_me(current_user: dict = Depends(require_auth())):
    """
    Get current user information.
    This endpoint demonstrates how to access the parsed user information from Keycloak token.
    Authentication is required to access this endpoint.
    """
    return current_user