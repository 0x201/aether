import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { SignInUserCommand } from 'src/users/commands/login-user.command';
import { SignUpUserCommand } from 'src/users/commands/signup-user.command';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from './auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AllowAnonymous()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() payload: SignInUserCommand) {
    const user = plainToClass(SignInUserCommand, payload);
    return this.authService.signIn(user);
  }

  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return req.user;
  }

  @AllowAnonymous()
  @Post('signup')
  async signUp(@Body() input: SignUpUserCommand) {
    return await this.authService.signUp(input);
  }
}
