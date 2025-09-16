import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SignUpUserCommand } from './commands/signup-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { Role } from '../roles/entities/role.entity';
import { UserQuery } from './queries/user.query';
import { UserDto } from './dtos/user.dto';
import { UserContextService } from '../shared/services/user-context.service';
import { GenericCrudAuditableService } from '../common/services/generic-crud-auditable.service';
import { CryptoService } from 'src/shared/services/crypto.service';
import { DateTimeService } from 'src/shared/services/datetime.service';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class UsersService extends GenericCrudAuditableService<User, SignUpUserCommand, UpdateUserCommand> {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    protected readonly dataSource: DataSource,
    private readonly cryptoService: CryptoService,
    protected readonly userContext: UserContextService,
    protected readonly dateTimeService: DateTimeService,
  ) {
    super(userRepository, dataSource, userContext, dateTimeService);
  }

  protected mapCreateDtoToEntity(command: SignUpUserCommand, entity: User): void {
    entity.username = command.username;
    entity.nickname = command.nickname;
    entity.isActive = true;
  }

  protected mapUpdateDtoToEntity(command: UpdateUserCommand, entity: User): void {
    entity.username ??= command.username;
    entity.nickname ??= command.nickname;
    entity.isActive ??= command.isActive;
  }

  protected async beforeCreate(queryRunner: QueryRunner, command: SignUpUserCommand, entity: User): Promise<void> {
    if (command.password) {
      const password = await this.cryptoService.hash(command.password);
      entity.password = password;
    }
    await super.beforeCreate(queryRunner, command, entity);
  }

  protected async afterCreate(queryRunner: QueryRunner, command: SignUpUserCommand, entity: User): Promise<void> {
    if (command.roleIds && command.roleIds.length > 0) {
      const roles: Role[] = await queryRunner.manager
        .createQueryBuilder(Role, 'role')
        .where('role.id IN (:...roleIds)', { roleIds: command.roleIds })
        .getMany();

      const userRolesToAdd = roles.map((role) => {
        const userRole = new UserRole();
        userRole.role = role;
        userRole.user = entity;
        userRole.assignedAt = this.dateTimeService.getNowString();
        userRole.assignedBy = this.userContext.getUsername();
        return userRole;
      });

      const savedUserRoles =await queryRunner.manager.save<UserRole>(userRolesToAdd);
      entity.userRoles = savedUserRoles;
    }

    await super.afterCreate(queryRunner, command, entity);
  }

  protected async afterUpdate(queryRunner: QueryRunner, command: UpdateUserCommand, entity: User): Promise<void> {
    if (command.roleIds) {
      await queryRunner.manager
        .createQueryBuilder(UserRole, 'userRole')
        .where('userId = :userId', { userId: entity.id })
        .delete()
        .execute();

      if (command.roleIds.length > 0) {
        const userRolesToAdd = command.roleIds.map((roleId) => {
          const userRole = new UserRole();
          userRole.user.id = entity.id;
          userRole.role.id = roleId;
          return userRole;
        });

        await this.dataSource.manager.save<UserRole>(userRolesToAdd);
      }
    }

    await super.afterUpdate(queryRunner, command, entity);
  }

  async findOneWithRoles(id: number): Promise<UserDto> {
    const user = await super.findOne(id);

    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const roles = await this.dataSource
      .createQueryBuilder('UserRole', 'userRole')
      .innerJoinAndSelect('Roles', 'role', 'userRole.RoleId = role.Id')
      .where('userRole.UserId = :id', { id: user.id })
      .getMany();

    const userDto: UserDto = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      isActive: user.isActive,
      createdTime: user.createdTime,
      lastModifiedTime: user.lastModifiedTime,
      roles: (roles as Role[]).map(role => ({
        id: role.id,
        name: role.name
      }))
    };

    return userDto;
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOneBy({ username })
  }

  async findByUsernameWithRoles(username: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  async findPaginatedUsers(query: UserQuery): Promise<[User[], number]> {
    return this.findPaginated(query, (qb: SelectQueryBuilder<User>) => {
      qb = qb.leftJoinAndSelect("user.userRoles", "userRole")
        .leftJoinAndSelect("userRole.role", "role")

      if (query.filter) {
        qb = qb.andWhere('user.username like :username', { username: `%${query.filter}%` });
      }

      if (query.startDate && query.endDate) {
        qb = qb.andWhere('user.createdTime >= :startDate', { 
          startDate: query.startDate 
        }).andWhere('user.createdTime <= :endDate', { 
          endDate: query.endDate 
        });
      }
      return qb;
    });
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }
}