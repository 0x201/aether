import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Request,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { SignInUserCommand } from '../users/commands/login-user.command';
import { SignUpUserCommand } from '../users/commands/signup-user.command';
import { AuthService } from './services/auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from './auth.guard';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AllowAnonymous()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() payload: SignInUserCommand) {
    const user = plainToClass(SignInUserCommand, payload);
    return this.authService.signin(user);
  }

  @AllowAnonymous()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refresh_token);
  }

  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return req.user;
  }

  @AllowAnonymous()
  @Post('signup')
  async signUp(@Body() input: SignUpUserCommand) {
    return await this.authService.signup(input);
  }
}