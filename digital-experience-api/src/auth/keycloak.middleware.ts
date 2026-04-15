import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { KeycloakStrategy } from './keycloak.strategy'

@Injectable()
export class KeycloakMiddleware implements NestMiddleware {
  constructor(private readonly keycloakStrategy: KeycloakStrategy) {}

  use(req: Request, res: Response, next: NextFunction) {
    const keycloak = this.keycloakStrategy.getKeycloakInstance()

    // Apply Keycloak middleware to all routes
    const middlewares = keycloak.middleware({
      logout: '/logout',
      admin: '/admin',
    })

    // Execute each middleware in sequence
    let index = 0
    const executeMiddleware = (err?: any) => {
      if (err) {
        return next(err)
      }

      if (index >= middlewares.length) {
        return next()
      }

      const middleware = middlewares[index++]
      middleware(req, res, executeMiddleware)
    }

    executeMiddleware()
  }
}
