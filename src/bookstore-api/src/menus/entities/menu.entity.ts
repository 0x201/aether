import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { RoleMenu } from './role-menu.entity';

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
}
