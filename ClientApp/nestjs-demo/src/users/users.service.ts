import { Injectable } from '@nestjs/common';
import { Repository, In, DataSource, } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SignInUserCommand } from './commands/login-user.command';
import { SignUpUserCommand } from './commands/signup-user.command';
import { UserDto } from './dtos/user.dto';
import { plainToClass } from 'class-transformer';
import { UtilsService } from 'src/shared/utils';
import { UserRole } from './entities/user-role.entity';
import { Role } from 'src/roles/entities/role.entity';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly utilsService: UtilsService
  ) { }

  async findOne(input: SignInUserCommand): Promise<User> {
    return await this.userRepository.findOne({
      where: {
        username: input.username,
      },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async insert(input: SignUpUserCommand): Promise<UserDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    let user = new User();
    try {
      const roles: Role[] = await queryRunner.manager.find(Role, { where: { name: In([...input.roles]) } });
      user.username = input.username;
      const [pwd, salt] = await this.utilsService.getPwdHash(input.password)
      user.password = pwd;
      user.salt = salt;
      user.nickname = input.nickname;
      user.createdTime = this.utilsService.getNowString();
      user = await queryRunner.manager.save(user);

      const userRolesToAdd = roles.map(role => {
        const userRole = new UserRole();
        userRole.userId = user.id;
        userRole.roleId = role.id;
        return userRole;
      });
      await queryRunner.manager.save(userRolesToAdd);

      await queryRunner.commitTransaction();

      return plainToClass(UserDto, user.username);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async count(): Promise<number> {
    return await this.userRepository.count();
  }
}
