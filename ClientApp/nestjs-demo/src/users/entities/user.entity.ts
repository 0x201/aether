import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
@Index('IDX_USER_USERNAME', ['username'], { unique: true })
export class User extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  username: string;

  @Column({type: 'varchar', length: 200, nullable: false})
  password: string;

  @Column({type: 'varchar', length: 128, nullable: false})
  salt: string;

  @Column({ type: 'varchar', length: 200 })
  nickname: string;

  @Column({ default: true, nullable: false })
  isActive: boolean;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];
}
