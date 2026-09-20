import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

import { Role } from "../../roles/entities/role.entity.js"
import { Menu } from "./menu.entity.js"

@Entity("role_menu", { schema: "bookstore" })
@Index("role_menu_role_id_menu_id_idx", ["menuId", "roleId"], { unique: true })
export class RoleMenu {
  @PrimaryGeneratedColumn({
    name: "id",
    primaryKeyConstraintName: "role_menu_pk",
  })
  id: number

  @Column({ name: "menu_id" })
  menuId: number

  @Column({ name: "role_id" })
  roleId: number

  @Column({ name: "assigned_at" })
  assignedAt: string

  @Column({ name: "assigned_by", length: 100, nullable: true })
  assignedBy: string

  @ManyToOne(() => Role, (role) => role.roleMenus, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "role_id" })
  role: Role

  @ManyToOne(() => Menu, (menu) => menu.roleMenus, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "menu_id" })
  menu: Menu
}
