import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { IAuditable } from 'src/common/interface/IPagedResult.interface';

@Entity('users')
export class User implements IAuditable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @Column()
  nickname: string;

  @CreateDateColumn({ name: 'createdTime' })
  createdTime: string;

  @Column({
    nullable: true,
  })
  createdBy: string;

  @UpdateDateColumn({ name: 'lastModifiedTime', nullable: true })
  lastModifiedTime: string;

  @Column({ nullable: true })
  lastModifiedBy: string;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];
}
