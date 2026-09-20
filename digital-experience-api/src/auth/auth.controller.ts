import { Controller, Get, Request } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"

import { AuthService } from "./services/auth.service.js"

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("profile")
  @ApiBearerAuth()
  getProfile(@Request() req: Request) {
    return req.user
  }

  // @AllowAnonymous()
  // @Post('signup')
  // async signUp(@Body() input: SignUpUserCommand) {
  //   return await this.authService.signup(input);
  // }
}
