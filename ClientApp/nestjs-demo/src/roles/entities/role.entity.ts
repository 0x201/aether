import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';
import { UserRole } from 'src/users/entities/user-role.entity';


@Entity('roles')
@Index('IDX_ROLE_NAME', ['name'], { unique: true })
export class Role extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ default: true, nullable: false })
  isActive: boolean;

  @OneToMany(() => UserRole, ur => ur.role)
  userRoles: UserRole[];
}
