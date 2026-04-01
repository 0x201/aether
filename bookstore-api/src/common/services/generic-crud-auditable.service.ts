import { DataSource, QueryRunner, Repository } from 'typeorm'
import { Logger } from '@nestjs/common'
import { BaseAuditableEntity } from '../BaseAuditableEntity.entity'
import { GenericCrudBaseService } from './generic-crud-base.service'

export abstract class GenericCrudAuditableService<
  T extends BaseAuditableEntity,
  CreateDto,
  UpdateDto,
> extends GenericCrudBaseService<T, CreateDto, UpdateDto> {
  protected readonly logger = new Logger(GenericCrudAuditableService.name)

  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
    protected readonly currentUserService: { getUsername(): string },
    protected readonly dateTimeService: { getNowString(): string },
  ) {
    super(repository, dataSource)
  }

  /**
   * Set audit fields for a new entity
   * @param entity Entity to set audit fields for
   */
  private setAuditFieldsForCreate(entity: T): void {
    const currentUser = this.currentUserService.getUsername()
    const now = this.dateTimeService.getNowString()

    entity.createdBy = currentUser
    entity.createdTime = now
    entity.lastModifiedBy = currentUser
    entity.lastModifiedTime = now
  }

  /**
   * Set audit fields for an updated entity
   * @param entity Entity to set audit fields for
   */
  private setAuditFieldsForUpdate(entity: T): void {
    const currentUser = this.currentUserService.getUsername()
    const now = this.dateTimeService.getNowString()

    entity.lastModifiedBy = currentUser
    entity.lastModifiedTime = now
  }

  /**
   * Override beforeCreate to automatically set audit fields
   * @param command Create DTO
   * @param entity Entity being created
   */
  protected async beforeCreate(
    queryRunner: QueryRunner,
    command: CreateDto,
    entity: T,
  ): Promise<void> {
    this.setAuditFieldsForCreate(entity)
    return super.beforeCreate(queryRunner, command, entity)
  }

  /**
   * Override beforeUpdate to automatically set audit fields
   * @param command Update DTO
   * @param entity Entity being updated
   */
  protected async beforeUpdate(
    queryRunner: QueryRunner,
    command: UpdateDto,
    entity: T,
  ): Promise<void> {
    this.setAuditFieldsForUpdate(entity)
    return super.beforeUpdate(queryRunner, command, entity)
  }
}
