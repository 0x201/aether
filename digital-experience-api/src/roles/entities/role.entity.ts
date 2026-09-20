import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm"

import { BaseAuditableEntity } from "../../common/BaseAuditableEntity.entity.js"
import { RoleMenu } from "../../menus/entities/role-menu.entity.js"
import { RoleDto } from "../dtos/role.dto.js"

@Entity("roles", { schema: "bookstore" })
@Index("roles_name_idx", ["name"], { unique: true })
export class Role extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: "id", primaryKeyConstraintName: "roles_pk" })
  id: number

  @Column({ name: "name", length: 200 })
  name: string

  @Column({ name: "is_active", default: true })
  isActive: boolean

  @OneToMany(() => RoleMenu, (roleMenu) => roleMenu.role, {
    createForeignKeyConstraints: false,
  })
  roleMenus: RoleMenu[]

  static mapRoleToRoleDto(role: Role): RoleDto {
    return {
      id: role.id,
      name: role.name,
    }
  }
}
