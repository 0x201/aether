import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

export interface IAuditable {
  createdTime: string
  createdBy: string
  lastModifiedTime: string
  lastModifiedBy: string
}

export class BaseAuditableEntity implements IAuditable {
  @CreateDateColumn({ name: "created_time", type: "timestamp with time zone" })
  createdTime: string

  @Column({ name: "created_by", default: "", length: 200 })
  createdBy: string

  @UpdateDateColumn({
    name: "last_modified_time",
    type: "timestamp with time zone",
    nullable: true,
  })
  lastModifiedTime: string

  @Column({ name: "last_modified_by", nullable: true, length: 200 })
  lastModifiedBy: string
}
