import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import keycloak from 'keycloak-js';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';


const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  const { authenticated, grantedRoles } = authData;
  const router = inject(Router);
  const keycloakService = inject(keycloak)

  if (!authenticated) {
    await keycloakService.login();
    return false;
  }
  const requiredRole = route.data['role'];
  if (!requiredRole) {
    return false;
  }

  const hasRequiredRole = (role: string): boolean =>
    Object.values(grantedRoles.realmRoles).some((roles) => roles.includes(role));

  if (authenticated && hasRequiredRole(requiredRole)) {
    return true;
  }

  return router.parseUrl('/forbidden');
}

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);