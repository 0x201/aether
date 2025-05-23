import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export interface IAuditable {
  createdTime: string;
  createdBy: string;
  lastModifiedTime: string;
  lastModifiedBy: string;
}

export class BaseAuditableEntity implements IAuditable {
  
  @CreateDateColumn({ name: 'createdTime' })
  createdTime: string;

  @Column({ default: '' })
  createdBy: string;

  @UpdateDateColumn({ name: 'lastModifiedTime', nullable: true })
  lastModifiedTime: string;

  @Column({ nullable: true })
  lastModifiedBy: string;
}