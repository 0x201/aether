import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KeycloakStrategy } from './keycloak.strategy';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private keycloakStrategy: KeycloakStrategy,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAllowAnonymous = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS,
      [context.getHandler(), context.getClass()],
    );

    if (isAllowAnonymous) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    try {
      // Check if Keycloak has already processed the request
      if (request.kauth && request.kauth.grant) {
        this.extractUserFromGrant(request);
        return true;
      }

      // If not processed, use Keycloak's protect middleware
      const isAuthenticated = await new Promise<boolean>((resolve) => {
        this.keycloakStrategy.getKeycloakInstance().protect()(request, null, (nextResult) => {
          resolve(!nextResult);
        });
      });

      if (isAuthenticated) {
        // After authentication, check for Keycloak data again
        if (request.kauth && request.kauth.grant) {
          this.extractUserFromGrant(request);
        }
        return true;
      }
    } catch (keycloakError) {
      this.logger.debug('Keycloak authentication failed', keycloakError);
    }

    this.logger.error('Authentication failed: No valid Keycloak token found.');
    throw new UnauthorizedException();
  }

  private extractUserFromGrant(request: any): void {
    const grant = request.kauth.grant;
    const accessToken = grant.access_token.content;
    
    // Extract roles from resource_access using the azp (authorized party) claim as client ID
    let roles: string[] = [];
    const clientId = accessToken.azp;
    
    if (clientId && accessToken.resource_access && accessToken.resource_access[clientId]) {
      roles = accessToken.resource_access[clientId].roles || [];
    } else if (accessToken.realm_access) {
      // Fallback to realm_access if resource_access is not available
      roles = accessToken.realm_access.roles || [];
    }
    
    request['user'] = {
      sub: accessToken.sub,
      username: accessToken.preferred_username,
      email: accessToken.email,
      roles: roles,
    };
  }
}

export const ALLOW_ANONYMOUS = 'AllowAnonymous';
export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS, true);