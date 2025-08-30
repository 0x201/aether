import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export interface IAuditable {
  createdTime: string;
  createdBy: string;
  lastModifiedTime: string;
  lastModifiedBy: string;
}

export class BaseAuditableEntity implements IAuditable {
  
  @CreateDateColumn()
  createdTime: string;

  @Column({ default: '', length: 200 })
  createdBy: string;

  @UpdateDateColumn({ name: 'lastModifiedTime', nullable: true })
  lastModifiedTime: string;

  @Column({ nullable: true, length: 200 })
  lastModifiedBy: string;
}