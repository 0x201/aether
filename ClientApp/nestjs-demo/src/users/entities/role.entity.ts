import { IAuditable } from 'src/common/interface/IPagedResult.interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
export class Role implements IAuditable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @CreateDateColumn({ name: 'createdTime' })
  createdTime: string;

  @Column({ default: '' })
  createdBy: string;

  @UpdateDateColumn({ name: 'lastModifiedTime', nullable: true })
  lastModifiedTime: string;

  @Column({ nullable: true })
  lastModifiedBy: string;
}
