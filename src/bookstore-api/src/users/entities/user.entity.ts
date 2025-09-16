import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { UserRole } from './user-role.entity';

@Entity('Users')
@Index('IDX_USER_USERNAME', ['username'], { unique: true })
export class User extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Username', type: 'varchar', length: 200 })
  username: string;

  @Column({ name: 'Password', type: 'varchar', length: 200 })
  password: string;

  @Column({ name: 'Nickname', type: 'varchar', length: 200, nullable: true })
  nickname: string;

  @Column({ name: 'IsActive', default: true })
  isActive: boolean;

  @OneToMany(() => UserRole, userRole => userRole.user, {
    createForeignKeyConstraints: false
  })
  userRoles: UserRole[];
}