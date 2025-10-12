"""
Authentication utilities for the API.
"""

from fastapi import HTTPException, status, Request, Depends
from src.api.deps import get_current_user
from typing import List


def require_auth():
    """
    Dependency that enforces authentication for an endpoint.
    Use this as a dependency in endpoints that require authentication.
    
    Example:
        @router.get("/protected")
        async def protected_endpoint(current_user: dict = Depends(require_auth())):
            return {"message": "Hello, authenticated user!"}
    """
    def _require_auth(current_user: dict = Depends(get_current_user)):
        return current_user
    return _require_auth


def require_roles(required_roles: List[str]):
    """
    Dependency that enforces role-based access control.
    Use this as a dependency in endpoints that require specific roles.
    
    Example:
        @router.get("/admin-only")
        async def admin_only_endpoint(current_user: dict = Depends(require_roles(["admin"]))):
            return {"message": "Hello, admin!"}
    """
    def _require_roles(current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("roles", [])
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return _require_roles