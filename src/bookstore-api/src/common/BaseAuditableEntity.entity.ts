import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface IAuditable {
  createdTime: string;
  createdBy: string;
  lastModifiedTime: string;
  lastModifiedBy: string;
}

export class BaseAuditableEntity implements IAuditable {
  @CreateDateColumn({ name: 'CreatedTime', type: 'datetime' })
  createdTime: string;

  @Column({ name: 'CreatedBy', default: '', length: 200 })
  createdBy: string;

  @UpdateDateColumn({
    name: 'LastModifiedTime',
    nullable: true,
    type: 'datetime',
  })
  lastModifiedTime: string;

  @Column({ name: 'LastModifiedBy', nullable: true, length: 200 })
  lastModifiedBy: string;
}
