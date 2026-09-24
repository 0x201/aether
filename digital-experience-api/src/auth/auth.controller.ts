import { Controller, Get } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"

import { AuthService } from "./services/auth.service.js"
import { CurrentUser } from "./current-user.decorator.js"
import type { AuthenticatedUser } from "./types.js"

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("profile")
  @ApiBearerAuth()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user
  }

  // @AllowAnonymous()
  // @Post('signup')
  // async signUp(@Body() input: SignUpUserCommand) {
  //   return await this.authService.signup(input);
  // }
}
