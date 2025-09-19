import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../jwt-payload.interface';
import { SignInUserCommand } from '../../users/commands/login-user.command';
import { SignUpUserCommand } from '../../users/commands/signup-user.command';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from '../jwt.config';
import { RolesService } from '../../roles/roles.service';
import { v4 as uuidv4 } from 'uuid';
import { MenusService } from '../../menus/menus.service';
import { Role } from 'src/roles/entities/role.entity';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { CryptoService } from 'src/shared/services/crypto.service';
import { Menu } from 'src/menus/entities/menu.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: JwtConfig;
  private readonly usedRefreshTokens: Set<string> = new Set();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly rolesService: RolesService,
    private readonly configService: ConfigService,
    private readonly menusService: MenusService,
    private readonly cryptoService: CryptoService,
    @Inject(REQUEST) private readonly request: Request
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwtConfig');
  }

  async signin(
    signInCommand: SignInUserCommand,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findByUsername(signInCommand.username);
    if (!user) {
      return null;
    }
    const isMatched = await this.cryptoService.compare(signInCommand.password, user.password);
    if (!isMatched) {
      this.logger.error('Invalid credentials. Request from ', { 
        ip: this.request.ip,
        ips: this.request.ips,
        remoteAddress: this.request.socket.remoteAddress,
        remoteFamily: this.request.socket.remoteFamily,
        remotePort: this.request.socket.remotePort,
      });
      throw new UnauthorizedException();
    }

    const roles: Role[] = await this.rolesService.findByUserId(user.id);
    const menus = await this.menusService.getUserMenus(user.id);

    const payload: JwtPayload = {
      sub: user.id.toString(),
      username: user.username,
      nickname: user.nickname,
      roles: roles.map(role => ({ id: role.id, name: role.name })),
      permissions: [],
      menus: menus.map(menu => Menu.mapToDto(menu)),
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.jwtConfig.expiresIn,
      secret: this.jwtConfig.secret,
    });

    // Generate refresh token
    const refreshPayload = {
      sub: user.id.toString(),
      username: user.username,
      tokenId: uuidv4(),
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: this.jwtConfig.refreshTokenExpiresIn,
      secret: this.jwtConfig.secret,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      if (this.usedRefreshTokens.has(refreshToken)) {
        throw new UnauthorizedException('Refresh token has been used');
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.jwtConfig.secret,
      });

      const user = await this.userService.findOneWithRoles(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.usedRefreshTokens.add(refreshToken);

      const menus = await this.menusService.getUserMenus(user.id);

      const newPayload: JwtPayload = {
        sub: user.id.toString(),
        username: user.username,
        nickname: user.nickname,
        roles: user.roles,
        permissions: [],
        menus: menus.map(menu => Menu.mapToDto(menu)),
      };

      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: this.jwtConfig.expiresIn,
        secret: this.jwtConfig.secret,
      });

      const newRefreshPayload = {
        sub: user.id.toString(),
        username: user.username,
        tokenId: uuidv4(),
      };

      const newRefreshToken = await this.jwtService.signAsync(
        newRefreshPayload,
        {
          expiresIn: this.jwtConfig.refreshTokenExpiresIn,
          secret: this.jwtConfig.secret,
        },
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async signup(input: SignUpUserCommand): Promise<any> {
    const user = await this.userService.findByUsername(input.username);
    const userExists = user !== null;

    if (userExists) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'User has already exists!',
      });
    }
    if (input.roles.length > 0) {
      const roles = await this.rolesService.findByIds(input.roles.map(role => role.id));
      const rolesExist = roles && roles.length > 0;
      if (!rolesExist) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: 'Not found roles!',
        });
      }
    }
    const res = await this.userService.insert(input);
    if (res) {
      return {
        status: HttpStatus.OK,
        message: 'User registered successfully!',
      };
    }
  }
}
