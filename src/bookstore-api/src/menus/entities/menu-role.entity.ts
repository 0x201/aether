import { Entity, PrimaryColumn } from 'typeorm';

@Entity('MenuRole')
export class MenuRole {
  @PrimaryColumn({ name: 'MenuId' })
  menuId: number;

  @PrimaryColumn({ name: 'RoleId' })
  roleId: number;
}
