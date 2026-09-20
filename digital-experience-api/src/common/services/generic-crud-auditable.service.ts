import { Logger, UnauthorizedException } from "@nestjs/common"
import { DataSource, QueryRunner, Repository } from "typeorm"

import { BaseAuditableEntity } from "../BaseAuditableEntity.entity.js"
import { GenericCrudBaseService } from "./generic-crud-base.service.js"

export interface IUsernameProvider {
  getUsername(): string | null
}

export interface IDateTimeProvider {
  getNowString(): string
}

export abstract class GenericCrudAuditableService<
  T extends BaseAuditableEntity,
  CreateDto,
  UpdateDto,
  TUserService extends IUsernameProvider = IUsernameProvider,
  TDateTimeService extends IDateTimeProvider = IDateTimeProvider,
> extends GenericCrudBaseService<T, CreateDto, UpdateDto> {
  protected readonly logger = new Logger(GenericCrudAuditableService.name)

  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
    protected readonly currentUserService: TUserService,
    protected readonly dateTimeService: TDateTimeService,
  ) {
    super(repository, dataSource)
  }

  /**
   * Set audit fields for a new entity
   * @param entity Entity to set audit fields for
   */
  private setAuditFieldsForCreate(entity: T): void {
    const currentUser = this.currentUserService.getUsername()
    if (!currentUser) {
      throw new UnauthorizedException("Cannot find current info, please try to login")
    }

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
    if (!currentUser) {
      throw new UnauthorizedException("Cannot find current info, please try to login")
    }
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
