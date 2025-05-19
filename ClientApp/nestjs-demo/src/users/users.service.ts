import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { genSalt, hash } from 'bcrypt';
import { SignInUserCommand } from './commands/login-user.command';
import { UserConstants } from './constants';
import { SignUpUserCommand } from './commands/signup-user.command';
import { UserDto } from './dtos/user.dto';
import { plainToClass } from 'class-transformer';
import { UtilsService } from 'src/shared/utils';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private utilsService: UtilsService
  ) { }

  async findOne(input: SignInUserCommand): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        username: input.username,
      },
      relations: ['roles'],
    });
  }

  async insert(input: SignUpUserCommand): Promise<UserDto> {
    const roles: Role[] = await this.roleRepository.find({
      where: {
        name: In([...input.roles]),
      },
    });
    let user = new User();
    user.username = input.username;
    const salt = await genSalt(UserConstants.saltRound);
    user.password = await hash(input.password, salt);
    user.salt = salt;
    user.nickname = input.nickname;
    user.roles = roles;
    user.createdTime = this.utilsService.getNowString();
    user = await this.userRepository.save(user);
    return plainToClass(UserDto, user.username);
  }

  async checkRolesExisted(roles: string[]): Promise<boolean> {
    const res = await this.roleRepository.find({
      where: {
        name: In([...roles]),
      },
    });
    return res.length <= 0 ? false : true;
  }

  async checkUserExist(username: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        username: username,
      },
    });
    return user === null ? false : true;
  }

  async checkDuplicateUsername(username: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { username: username },
    });
    if (user) {
      return false;
    }
    return true;
  }
}
