import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"

import { ROLES_KEY } from "./role.decorator.js"
import { RoleEnum } from "./role.enum.js"

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user
    if (!user) {
      return false
    }

    const userRoles = user.roles || []
    const hasRole = requiredRoles.some(
      (role) =>
        userRoles.includes(role) ||
        userRoles.includes(Object.values(RoleEnum).find((enumRole) => enumRole === role)),
    )

    if (!hasRole) {
      throw new ForbiddenException("Insufficient permissions")
    }

    return true
  }
}
