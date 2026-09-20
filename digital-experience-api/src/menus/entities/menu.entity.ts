import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"

import { BaseAuditableEntity } from "../../common/BaseAuditableEntity.entity.js"
import { MenuDto } from "../dtos/menu.dto.js"
import { RoleMenu } from "./role-menu.entity.js"

@Entity("menus", { schema: "bookstore" })
export class Menu extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: "id", primaryKeyConstraintName: "menus_pk" })
  id: number

  @Column({ name: "name", length: 100 })
  name: string

  @Column({ name: "title", length: 100 })
  title: string

  @Column({ name: "icon", nullable: true })
  icon: string

  @Column({ name: "route", nullable: true })
  route: string

  @Column({ name: "order" })
  order: number

  @Column({ name: "parent_id", nullable: true })
  parentId: number

  @Column({ name: "is_active", default: true })
  isActive: boolean

  @OneToMany(() => RoleMenu, (roleMenu) => roleMenu.menu, {
    createForeignKeyConstraints: false,
  })
  roleMenus: RoleMenu[]

  static mapToDto(menu: Menu): MenuDto {
    return {
      id: menu.id,
      name: menu.name,
      title: menu.title,
      icon: menu.icon,
      route: menu.route,
      order: menu.order,
      parentId: menu.parentId,
      isActive: menu.isActive,
      roles: menu.roleMenus.map((roleMenu) => ({
        id: roleMenu.role.id,
        name: roleMenu.role.name,
      })),
    }
  }
}
