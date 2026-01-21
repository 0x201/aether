import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { RoleMenu } from '../../menus/entities/role-menu.entity';
import { RoleDto } from '../dtos/role.dto';

@Entity('roles', { schema: 'bookstore' })
@Index('roles_name_idx', ['name'], { unique: true })
export class Role extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'roles_pk' })
  id: number;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => RoleMenu, roleMenu => roleMenu.role, {
    createForeignKeyConstraints: false
  })
  roleMenus: RoleMenu[];

  static mapRoleToRoleDto(role: Role): RoleDto {
    return {
      id: role.id,
      name: role.name
    };
  }
}