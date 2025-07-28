import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
@Index('IDX_USER_USERNAME', ['username'], { unique: true })
export class User extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  username: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @Column({ type: 'varchar', length: 128 })
  salt: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nickname: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];
}
