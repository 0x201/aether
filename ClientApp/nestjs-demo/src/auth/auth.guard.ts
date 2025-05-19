import {
  CanActivate,
  ExecutionContext,
  Injectable,
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
      IS_ALLOW_ANONYMOUS,
      [context.getHandler(), context.getClass()],
    );

    if (isAllowAnonymous) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtConfig.secret,
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export const IS_ALLOW_ANONYMOUS = 'isAllowAnonymous';
export const AllowAnonymous = () => SetMetadata(IS_ALLOW_ANONYMOUS, true);
