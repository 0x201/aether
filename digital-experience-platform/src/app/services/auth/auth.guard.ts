import { inject } from '@angular/core'
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router'
import Keycloak from 'keycloak-js'

const canActivateAuthRole: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean | UrlTree> => {
  const router = inject(Router)
  const keycloakService = inject(Keycloak)

  // Check if user is authenticated
  if (!keycloakService.authenticated) {
    try {
      await keycloakService.login()
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return router.parseUrl('/forbidden')
    }
  }

  // Get required role from route data
  const requiredRole = route.data['roles']
  if (!requiredRole) {
    return true // No role required
  }

  // Extract roles using the same logic as in the backend
  const accessToken = keycloakService.tokenParsed
  if (!accessToken) {
    return router.parseUrl('/forbidden')
  }

  // Extract roles from resource_access using the azp (authorized party) claim as client ID
  let userRoles: string[] = []
  const clientId = accessToken.azp

  if (clientId && accessToken.resource_access && accessToken.resource_access[clientId]) {
    userRoles = accessToken.resource_access[clientId].roles || []
  } else if (accessToken.realm_access) {
    // Fallback to realm_access if resource_access is not available
    userRoles = accessToken.realm_access.roles || []
  }

  // Check if user has required role
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))

  if (hasRequiredRole) {
    return true
  }

  return router.parseUrl('/forbidden')
}

export { canActivateAuthRole }
