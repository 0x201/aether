import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { MenuDto } from './dtos/menu.dto';
import { MenuQuery } from './queries/menu.query';
import { CreateMenuCommand } from './commands/create-menu.command';
import { Role } from 'src/roles/entities/role.entity';
import { RoleMenu } from './entities/role-menu.entity';
import { UserContextService } from 'src/shared/services/user-context.service';
import { UpdateMenuCommand } from './commands/update-menu.command';
import { GenericCrudAuditableService } from 'src/common/services/generic-crud-auditable.service';
import { DateTimeService } from 'src/shared/services/datetime.service';

@Injectable()
export class MenusService extends GenericCrudAuditableService<Menu, CreateMenuCommand, UpdateMenuCommand> {
  protected readonly logger = new Logger(MenusService.name)
  constructor(
    @InjectRepository(Menu)
    protected readonly menuRepository: Repository<Menu>,
    protected readonly dataSource: DataSource,
    protected readonly userContext: UserContextService,
    protected readonly dateTimeService: DateTimeService,
  ) {
    super(menuRepository, dataSource, userContext, dateTimeService);
  }

  protected mapCreateDtoToEntity(command: CreateMenuCommand, entity: Menu): void {
    entity.name = command.name;
    entity.title = command.title;
    entity.route = command.route;
    entity.icon = command.icon;
    entity.order = command.order;
    entity.parentId = command.parentId;
    entity.isActive = true;
  }

  protected mapUpdateDtoToEntity(command: UpdateMenuCommand, entity: Menu): void {
    Object.assign(entity, {
      title: command.title ?? entity.title,
      name: command.name ?? entity.name,
      route: command.route ?? entity.route,
      icon: command.icon ?? entity.icon,
      order: command.order ?? entity.order,
      parentId: command.parentId ?? entity.parentId,
      isActive: command.isActive ?? entity.isActive,
    });
  }

  protected async afterCreate(queryRunner: QueryRunner, command: CreateMenuCommand, entity: Menu): Promise<void> {
    if (command.roleIds && command.roleIds.length > 0) {
      const roles: Role[] = await queryRunner.manager
        .createQueryBuilder(Role, "role")
        .where("role.id IN (:...roleIds)", { roleIds: command.roleIds })
        .getMany();
      const roleMenusToSave: RoleMenu[] = roles.map((role) => {
        const roleMenu = new RoleMenu();
        roleMenu.role = role;
        roleMenu.menu = entity;
        roleMenu.assignedAt = this.dateTimeService.getNowString();
        roleMenu.assignedBy = this.userContext.getUsername();
        return roleMenu;
      });

      const savedRoleMenus = await queryRunner.manager.save<RoleMenu>(roleMenusToSave);
      entity.roleMenus = savedRoleMenus;
    }
    await super.afterCreate(queryRunner, command, entity);
  }

  protected async afterUpdate(queryRunner: QueryRunner, command: UpdateMenuCommand, entity: Menu): Promise<void> {
    if (command.roleIds) {
      await queryRunner.manager
        .createQueryBuilder(RoleMenu, "roleMenu")
        .where('menuId = :menuId', { menuId: entity.id })
        .delete()
        .execute();

      if (command.roleIds.length > 0) {
        const menuRolesToAdd = command.roleIds.map((roleId) => {
          const menuRole = new RoleMenu();
          menuRole.menu.id = entity.id;
          menuRole.role.id = roleId;
          return menuRole;
        });
        await this.dataSource
          .createQueryBuilder(RoleMenu, "roleMenu")
          .insert()
          .into(RoleMenu)
          .values(menuRolesToAdd)
          .execute();
      }
    }
    await super.afterUpdate(queryRunner, command, entity);
  }

  async getUserMenus(userId: number): Promise<Menu[]> {
    const menus = await this.dataSource
      .createQueryBuilder('Menus', 'menu')
      .innerJoin('RoleMenu', 'menuRole', 'menuRole.MenuId = menu.Id')
      .innerJoin('UserRole', 'userRole', 'userRole.RoleId = menuRole.RoleId')
      .where('userRole.UserId = :userId', { userId })
      .andWhere('menu.IsActive = :isActive', { isActive: true })
      .orderBy('menu.Order', 'ASC')
      .getMany();

    return menus as Menu[];
  }

  private sortMenus(menus: Menu[]): void {
    menus.sort((a, b) => (a as any).order - (b as any).order);
    menus.forEach((menu) => {
      if ((menu as any).children && (menu as any).children.length > 0) {
        this.sortMenus((menu as any).children);
      }
    });
  }

  async findMenus(query: MenuQuery): Promise<[Menu[], number]> {
    let qb = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.roles', 'role')
      .where('menu.isActive = :isActive', { isActive: true });

    if (query.filter) {
      qb = qb.andWhere('menu.name like :filter', {
        filter: '%' + query.filter + '%',
      });
    }

    return await qb
      .orderBy(query.sorting, query.order === 'asc' ? 'ASC' : 'DESC')
      .skip(query.skipCount)
      .take(query.maxResultCount)
      .getManyAndCount();
  }

  async getAllMenus(): Promise<MenuDto[]> {
    const menus = await this.menuRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
      relations: ['roles'],
    });

    return menus.map((menu) => ({
      id: menu.id,
      icon: menu.icon,
      name: menu.name,
      order: menu.order,
      parentId: menu.parentId,
      route: menu.route,
      title: menu.title,
      isActive: menu.isActive,
      roles: []
    }));
  }

  async delete(id: number): Promise<void> {
    return super.delete(id);
  }

  async findOne(id: number): Promise<Menu> {
    return super.findOne(id, {
      relations: ['roles'],
    });
  }

  async count(): Promise<number> {
    return super.count();
  }
}