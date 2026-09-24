import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, DataSource, QueryRunner, SelectQueryBuilder } from "typeorm"

import { GenericCrudAuditableService } from "@/src/common/services/generic-crud-auditable.service.js"
import { Role } from "@/src/roles/entities/role.entity.js"
import { DateTimeService } from "@/src/shared/services/datetime.service.js"
import { UserContextService } from "@/src/shared/services/user-context.service.js"

import { CreateMenuCommand } from "./commands/create-menu.command.js"
import { UpdateMenuCommand } from "./commands/update-menu.command.js"
import { MenuDto } from "./dtos/menu.dto.js"
import { Menu } from "./entities/menu.entity.js"
import { RoleMenu } from "./entities/role-menu.entity.js"
import { MenuQuery } from "./queries/menu.query.js"

@Injectable()
export class MenusService extends GenericCrudAuditableService<
  Menu,
  CreateMenuCommand,
  UpdateMenuCommand
> {
  protected readonly logger = new Logger(MenusService.name)
  constructor(
    @InjectRepository(Menu)
    protected readonly menuRepository: Repository<Menu>,
    protected readonly dataSource: DataSource,
    protected readonly userContext: UserContextService,
    protected readonly dateTimeService: DateTimeService,
  ) {
    super(menuRepository, dataSource, userContext, dateTimeService)
  }

  protected mapCreateDtoToEntity(command: CreateMenuCommand, entity: Menu): void {
    entity.name = command.name
    entity.title = command.title
    entity.route = command.route
    entity.icon = command.icon
    entity.order = command.order
    entity.parentId = command.parentId
    entity.isActive = true
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
    })
  }

  protected async afterCreate(
    queryRunner: QueryRunner,
    command: CreateMenuCommand,
    entity: Menu,
  ): Promise<void> {
    if (command.roles && command.roles.length > 0) {
      const roles: Role[] = await queryRunner.manager
        .createQueryBuilder(Role, "role")
        .where("role.id IN (:...roleIds)", {
          roleIds: command.roles.map((role) => role.id),
        })
        .getMany()
      const roleMenusToSave: RoleMenu[] = roles.map((role) => {
        const roleMenu = new RoleMenu()
        roleMenu.role = role
        roleMenu.menu = entity
        roleMenu.assignedAt = this.dateTimeService.getNowString()
        roleMenu.assignedBy = this.userContext.getUsername()
        return roleMenu
      })

      const savedRoleMenus = await queryRunner.manager.save<RoleMenu>(roleMenusToSave)
      entity.roleMenus = savedRoleMenus
    }
    await super.afterCreate(queryRunner, command, entity)
  }

  protected async afterUpdate(
    queryRunner: QueryRunner,
    command: UpdateMenuCommand,
    entity: Menu,
  ): Promise<void> {
    if (command.roles) {
      await queryRunner.manager
        .createQueryBuilder(RoleMenu, "roleMenu")
        .where("menuId = :menuId", { menuId: entity.id })
        .delete()
        .execute()

      if (command.roles.length > 0) {
        const roleMenusToAdd = command.roles.map((role) => {
          const roleMenu = new RoleMenu()
          roleMenu.menuId = entity.id
          roleMenu.roleId = role.id
          roleMenu.assignedAt = this.dateTimeService.getNowString()
          roleMenu.assignedBy = this.userContext.getUsername()
          return roleMenu
        })

        await queryRunner.manager.save(roleMenusToAdd)
      }
    }
    await super.afterUpdate(queryRunner, command, entity)
  }

  async getUserMenus(userRoles: string[]): Promise<Menu[]> {
    if (!userRoles || userRoles.length === 0) {
      return []
    }

    const menus = await this.dataSource
      .createQueryBuilder(Menu, "menu")
      .innerJoinAndSelect("menu.roleMenus", "roleMenu")
      .innerJoinAndSelect("roleMenu.role", "role")
      .where("role.Name IN (:...roleNames)", { roleNames: userRoles })
      .andWhere("menu.IsActive = :isActive", { isActive: true })
      .orderBy("menu.Order", "ASC")
      .getMany()

    return menus
  }

  private sortMenus(menus: Menu[]): void {
    menus.sort((a, b) => (a as any).order - (b as any).order)
    menus.forEach((menu) => {
      if ((menu as any).children && (menu as any).children.length > 0) {
        this.sortMenus((menu as any).children)
      }
    })
  }

  async findMenus(query: MenuQuery): Promise<[Menu[], number]> {
    return this.findPaginated(query, (qb: SelectQueryBuilder<Menu>) => {
      qb = qb
        .leftJoinAndSelect("menu.roleMenus", "roleMenu")
        .leftJoinAndSelect("roleMenu.role", "role")

      if (query.filter) {
        qb = qb.andWhere("menu.title like :title", {
          title: `%${query.filter}%`,
        })
      }
      return qb
    })
  }

  async getAllMenus(): Promise<MenuDto[]> {
    const menus = await this.menuRepository.find({
      where: { isActive: true },
      order: { order: "ASC" },
      relations: {
        roleMenus: true,
      },
    })

    return menus.map((menu) => ({
      id: menu.id,
      icon: menu.icon,
      name: menu.name,
      order: menu.order,
      parentId: menu.parentId,
      route: menu.route,
      title: menu.title,
      isActive: menu.isActive,
      roles: [],
    }))
  }

  async delete(id: number): Promise<void> {
    return super.delete(id)
  }

  async findOne(id: number): Promise<Menu | null> {
    return super.findOne(id, {
      relations: {
        roleMenus: true,
      },
    })
  }

  async count(): Promise<number> {
    return super.count()
  }
}
