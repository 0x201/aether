import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { SignInUserCommand } from '../users/commands/login-user.command';
import { SignUpUserCommand } from '../users/commands/signup-user.command';
import { compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from './jwt.config';
import { RolesService } from '../roles/roles.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;
  private readonly usedRefreshTokens: Set<string> = new Set();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly rolesService: RolesService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwtConfig');
  }


  async signIn(
    signInCommand: SignInUserCommand,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findOne(signInCommand);
    if (!user) {
      return null;
    }
    const isMatched = await compare(signInCommand.password, user.password);
    if (!isMatched) {
      throw new UnauthorizedException();
    }
    const roles: string[] =
      user.userRoles.length == 0 ? [] : user.userRoles.map((x) => x.role.name);
    const payload: JwtPayload = {
      sub: user.id.toString(),
      username: user.username,
      nickname: user.nickname,
      roles: roles,
      permissions: [],
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

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      if (this.usedRefreshTokens.has(refreshToken)) {
        throw new UnauthorizedException('Refresh token has been used');
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.jwtConfig.secret,
      });
      
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      this.usedRefreshTokens.add(refreshToken);
      
      const roles: string[] =
        user.userRoles.length == 0 ? [] : user.userRoles.map((x) => x.role.name);
      const newPayload: JwtPayload = {
        sub: user.id.toString(),
        username: user.username,
        nickname: user.nickname,
        roles: roles,
        permissions: [],
      };
      
      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: this.jwtConfig.expiresIn,
        secret: this.jwtConfig.secret,
      });
      
      // 生成新的refresh token
      const newRefreshPayload = {
        sub: user.id.toString(),
        username: user.username,
        tokenId: uuidv4(),
      };
      
      const newRefreshToken = await this.jwtService.signAsync(newRefreshPayload, {
        expiresIn: this.jwtConfig.refreshTokenExpiresIn,
        secret: this.jwtConfig.secret,
      });
      
      return { 
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async signUp(input: SignUpUserCommand): Promise<any> {
    const user = await this.userService.findOne(input);
    const userExists = user !== null;

    if (userExists) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'User has already exists!',
      });
    }
    if (input.roles.length > 0) {
      const roles = await this.rolesService.findByNames(input.roles);
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