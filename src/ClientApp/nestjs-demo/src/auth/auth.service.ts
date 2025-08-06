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

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;

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
  ): Promise<{ access_token: string }> {
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
    return { access_token: await this.jwtService.signAsync(payload) };
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
      const rolesExist = !roles && roles.length > 0;
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
