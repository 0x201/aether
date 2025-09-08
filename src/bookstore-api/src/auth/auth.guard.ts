import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtConfig } from './jwt.config';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly jwtConfig: JwtConfig;
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwtConfig');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAllowAnonymous = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS,
      [context.getHandler(), context.getClass()],
    );

    if (isAllowAnonymous) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.error('No token found in the request headers.');
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtConfig.secret,
      });
      request['user'] = payload;
    } catch (error) {
      this.logger.error("An error occurred while verifying the JWT token.", error);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export const ALLOW_ANONYMOUS = 'AllowAnonymous';
export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS, true);
