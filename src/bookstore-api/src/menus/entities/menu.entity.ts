import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('menus')
export class Menu extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  route: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int', nullable: true })
  parentId: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Role, { cascade: true })
  @JoinTable({
    name: 'menu_role',
    joinColumn: { name: 'menu_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles: Role[];
}