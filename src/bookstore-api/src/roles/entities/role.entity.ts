import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { RoleMenu } from '../../menus/entities/role-menu.entity';

@Entity('Roles')
@Index('IDX_ROLE_NAME', ['name'], { unique: true })
export class Role extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'IsActive', default: true })
  isActive: boolean;


  @OneToMany(() => UserRole, userRole => userRole.role, {
    createForeignKeyConstraints: false
  })
  userRoles: UserRole[];

  @OneToMany(() => RoleMenu, roleMenu => roleMenu.role, {
    createForeignKeyConstraints: false
  })
  roleMenus: RoleMenu[];
}