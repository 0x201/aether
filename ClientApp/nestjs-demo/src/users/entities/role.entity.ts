import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';

@Entity('roles')
export class Role extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
