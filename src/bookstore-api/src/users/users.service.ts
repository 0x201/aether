import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, In, DataSource, } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SignUpUserCommand } from './commands/signup-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { UtilsService } from '../shared/utils';
import { UserRole } from './entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { UserQuery } from './queries/user.query';
import { UserDto } from './dtos/user.dto';
import { CurrentUser } from 'src/shared/current-user.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly utilsService: UtilsService,
    private readonly currentUser: CurrentUser
  ) { }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['userRoles', 'userRoles.role'],
    });

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: ['userRoles', 'userRoles.role'],
    });

    return user;
  }

  async findAll(query: UserQuery): Promise<[User[], number]> {
    let qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role');
    if (query.filter) {
      qb = qb.where('user.username like :username', { username: query.filter + '%' });
    }
    if (query.startDate && query.endDate) {
      qb = qb.andWhere('user.createdTime >= :startDate', { startDate: query.startDate });
      qb = qb.andWhere('user.createdTime <= :endDate', { endDate: query.endDate });
    }

    const [users, count] = await qb
      .orderBy(query.sorting, query.order === 'asc' ? 'ASC' : 'DESC')
      .skip(query.skipCount)
      .take(query.maxResultCount)
      .getManyAndCount();

    return [users, count];
  }

  async insert(input: SignUpUserCommand): Promise<User> {
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

      return user
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, input: UpdateUserCommand): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.username = input.username ?? user.username;
    user.nickname = input.nickname ?? user.nickname;
    user.isActive = input.isActive ?? user.isActive;

    user.lastModifiedTime = this.utilsService.getNowString();
    user.lastModifiedBy = this.currentUser.getUsername();

    await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async count(): Promise<number> {
    return await this.userRepository.count();
  }

  private mapToDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.nickname = user.nickname;
    dto.isActive = user.isActive;
    dto.createdTime = user.createdTime;
    dto.lastModifiedTime = user.lastModifiedTime;
    return dto;
  }
}