import {
  //BadRequestException,
  //HttpStatus,
  Inject,
  Injectable,
  Logger,
  //NotFoundException,
} from '@nestjs/common'
//import { RolesService } from "../../roles/roles.service";
import type { Request } from 'express'
import { REQUEST } from '@nestjs/core'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(@Inject(REQUEST) private readonly request: Request) {}

  // async signup(input: SignUpUserCommand) {
  //   const user = await this.userService.findByUsername(input.username);
  //   const userExists = user !== null;

  //   if (userExists) {
  //     throw new BadRequestException({
  //       status: HttpStatus.BAD_REQUEST,
  //       message: 'User has already exists!',
  //     });
  //   }
  //   if (input.roles.length > 0) {
  //     const roles = await this.rolesService.findByIds(input.roles.map(role => role.id));
  //     const rolesExist = roles && roles.length > 0;
  //     if (!rolesExist) {
  //       throw new NotFoundException({
  //         status: HttpStatus.NOT_FOUND,
  //         message: 'Not found roles!',
  //       });
  //     }
  //   }
  //   return await this.userService.insert(input);
  // }
}
