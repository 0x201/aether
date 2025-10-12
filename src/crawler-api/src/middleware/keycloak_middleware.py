from config import config
from fastapi import Request
from keycloak import KeycloakOpenID
from keycloak.exceptions import KeycloakAuthenticationError, KeycloakGetError


class KeycloakMiddleware:
    def __init__(self, app):
        self.app = app
        self.keycloak_openid = KeycloakOpenID(
            server_url=config.app_config.keycloak_config.server_url,
            client_id=config.app_config.keycloak_config.client_id,
            realm_name=config.app_config.keycloak_config.realm,
            client_secret_key=config.app_config.keycloak_config.client_secret,
            verify=True
        )

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        if request.url.path in ["/health", "/scalar", "/docs", "/redoc", "/openapi.json"]:
            await self.app(scope, receive, send)
            return

        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            # For unauthorized requests, we still continue but without setting user info
            await self.app(scope, receive, send)
            return

        try:
            # Extract token
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                await self.app(scope, receive, send)
                return

            # Introspect token
            token_info = self.keycloak_openid.introspect(token)
            
            if not token_info.get("active"):
                await self.app(scope, receive, send)
                return

            # Extract detailed user information
            user_info = {
                "id": token_info.get("sub"),
                "username": token_info.get("preferred_username", token_info.get("sub")),
                "email": token_info.get("email"),
                "name": token_info.get("name"),
                "roles": self._extract_roles(token_info)
            }

            # Add user info to the scope for later retrieval
            scope["current_user"] = user_info
            
        except (ValueError, KeycloakAuthenticationError, KeycloakGetError):
            # If token validation fails, continue without user info
            pass
        except Exception:
            # If any other error occurs, continue without user info
            pass

        await self.app(scope, receive, send)

    def _extract_roles(self, token_info):
        """
        Extract roles from the token information.
        Looks for roles in both resource_access and realm_access.
        """
        roles = []
        
        client_id = self.keycloak_openid.client_id
        if "resource_access" in token_info and client_id in token_info["resource_access"]:
            client_roles = token_info["resource_access"][client_id].get("roles", [])
            roles.extend(client_roles)
        
        if "realm_access" in token_info:
            realm_roles = token_info["realm_access"].get("roles", [])
            roles.extend(realm_roles)
            
        return list(set(roles))  # Remove duplicates
