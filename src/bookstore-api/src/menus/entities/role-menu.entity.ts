import { Role } from '../../roles/entities/role.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Menu } from './menu.entity';

@Entity('RoleMenu')
@Index("IDX_RoleMenu_RoleId_MenuId", ["menuId", "roleId"], { unique: true })
export class RoleMenu {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: "MenuId" })
  menuId: number;

  @Column({ name: "RoleId" })
  roleId: number;

  @Column({ name: "AssignedAt", type: 'datetime', default: () => "GETDATE()" })
  assignedAt: string;

  @Column({ name: "AssignedBy", length: 100, nullable: true })
  assignedBy: string;

  @ManyToOne(() => Role, role => role.roleMenus, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({ name: "RoleId" })
  role: Role;

  @ManyToOne(() => Menu, menu => menu.roleMenus, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({ name: "MenuId" })
  menu: Menu;
}
