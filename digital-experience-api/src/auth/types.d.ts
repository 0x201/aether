import "express-serve-static-core"

export interface AuthenticatedUser {
  sub: string
  username?: string
  email?: string
  roles: string[]
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser
    kauth?: {
      grant: any
    }
  }
}
