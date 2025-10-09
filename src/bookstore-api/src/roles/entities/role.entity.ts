import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { RoleMenu } from '../../menus/entities/role-menu.entity';
import { RoleDto } from '../dtos/role.dto';

@Entity('Roles')
@Index('IDX_ROLE_NAME', ['name'], { unique: true })
export class Role extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'IsActive', default: true })
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