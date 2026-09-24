import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { AuthenticatedUser } from "./types.js"

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    return data ? user?.[data] : user
  },
)
