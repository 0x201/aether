import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { RoleMenu } from './role-menu.entity';
import { MenuDto } from '../dtos/menu.dto';

@Entity('Menus')
export class Menu extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'Title', type: 'varchar', length: 100 })
  title: string;

  @Column({ name: 'Icon', type: 'varchar', length: 200, nullable: true })
  icon: string;

  @Column({ name: 'Route', type: 'varchar', length: 200, nullable: true })
  route: string;

  @Column({ name: 'Order', type: 'int' })
  order: number;

  @Column({ name: 'ParentId', type: 'int', nullable: true })
  parentId: number;

  @Column({ name: 'IsActive', default: true })
  isActive: boolean;

  @OneToMany(() => RoleMenu, roleMenu => roleMenu.menu, {
    createForeignKeyConstraints: false
  })
  roleMenus: RoleMenu[];

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
      roles: menu.roleMenus.map(roleMenu => ({id: roleMenu.role.id, name: roleMenu.role.name}))
    };
  }
}
