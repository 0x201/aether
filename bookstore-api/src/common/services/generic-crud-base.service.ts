import { DataSource, Repository, FindManyOptions, FindOneOptions, QueryRunner } from 'typeorm'
import { Logger, Type } from '@nestjs/common'
import { BaseAuditableEntity } from '../BaseAuditableEntity.entity'
import { PagedSortedAndFilteredResultQuery } from '../queries/PagedResult.query'

export abstract class GenericCrudBaseService<T extends BaseAuditableEntity, CreateDto, UpdateDto> {
  protected readonly logger = new Logger(GenericCrudBaseService.name)

  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
  ) {}

  /**
   * Abstract method to map Create DTO to entity
   * Implementation should be provided by subclasses
   */
  protected abstract mapCreateDtoToEntity(command: CreateDto, entity: T): void

  /**
   * Abstract method to map Update DTO to entity
   * Implementation should be provided by subclasses
   */
  protected abstract mapUpdateDtoToEntity(command: UpdateDto, entity: T): void

  /**
   * Hook method called before creating an entity
   * Can be overridden by subclasses for additional logic
   */
  protected async beforeCreate(
    _queryRunner: QueryRunner,
    _command: CreateDto,
    _entity: T,
  ): Promise<void> {
    // Default implementation - do nothing
    return Promise.resolve()
  }

  /**
   * Hook method called after creating an entity
   * Can be overridden by subclasses for additional logic
   */
  protected async afterCreate(
    _queryRunner: QueryRunner,
    _command: CreateDto,
    _entity: T,
  ): Promise<void> {
    // Default implementation - do nothing
    return Promise.resolve()
  }

  /**
   * Hook method called before updating an entity
   * Can be overridden by subclasses for additional logic
   */
  protected async beforeUpdate(
    _queryRunner: QueryRunner,
    _command: UpdateDto,
    _entity: T,
  ): Promise<void> {
    // Default implementation - do nothing
    return Promise.resolve()
  }

  /**
   * Hook method called after updating an entity
   * Can be overridden by subclasses for additional logic
   */
  protected async afterUpdate(
    _queryRunner: QueryRunner,
    _command: UpdateDto,
    _entity: T,
  ): Promise<void> {
    // Default implementation - do nothing
    return Promise.resolve()
  }

  /**
   * Hook method called before deleting an entity
   * Can be overridden by subclasses for additional logic
   */
  protected async beforeDelete(_queryRunner: QueryRunner, _entity: T): Promise<void> {
    // Default implementation - do nothing
    return Promise.resolve()
  }

  /**
   * Hook method called after deleting an entity
   * Can be overridden by subclasses for additional logic
   */
  protected async afterDelete(_queryRunner: QueryRunner, _entity: T): Promise<void> {
    // Default implementation - do nothing
    return Promise.resolve()
  }

  /**
   * Execute a function within a transaction context
   * @param operation Function to execute within a transaction
   * @returns Result of the operation
   */
  protected async executeInTransaction<R>(
    operation: (queryRunner: QueryRunner) => Promise<R>,
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const result = await operation(queryRunner)
      await queryRunner.commitTransaction()
      return result
    } catch (error) {
      await queryRunner.rollbackTransaction()
      this.logger.error(`Error in transaction`, error)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Create a new entity
   * @param command Create DTO
   * @returns Created entity
   */
  async insert(command: CreateDto): Promise<T> {
    return this.executeInTransaction(async (queryRunner) => {
      const entity = this.repository.create()
      this.mapCreateDtoToEntity(command, entity)

      await this.beforeCreate(queryRunner, command, entity)

      const savedEntity = await queryRunner.manager.save(entity)

      await this.afterCreate(queryRunner, command, savedEntity)

      return savedEntity
    })
  }

  /**
   * Create multiple entities
   * @param commands Array of Create DTOs
   */
  async insertMany(commands: CreateDto[]): Promise<void> {
    return this.executeInTransaction(async (queryRunner) => {
      const entities: T[] = []

      for (const command of commands) {
        const entity = this.repository.create()
        this.mapCreateDtoToEntity(command, entity)
        await this.beforeCreate(queryRunner, command, entity)
        entities.push(entity)
      }

      const savedEntities = await queryRunner.manager.save(entities)

      for (let i = 0; i < commands.length; i++) {
        await this.afterCreate(queryRunner, commands[i], savedEntities[i])
      }
    })
  }

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param command Update DTO
   * @returns Updated entity
   */
  async update(id: number, command: UpdateDto): Promise<T> {
    return this.executeInTransaction(async (queryRunner) => {
      const entity = await queryRunner.manager.findOne(this.repository.target as Type<T>, {
        where: { id } as any,
      })

      if (!entity) {
        throw new Error(`Entity with ID ${id} not found`)
      }

      this.mapUpdateDtoToEntity(command, entity)

      await this.beforeUpdate(queryRunner, command, entity)

      const updatedEntity = await queryRunner.manager.save(entity)

      await this.afterUpdate(queryRunner, command, updatedEntity)

      return updatedEntity
    })
  }

  /**
   * Delete an entity by ID
   * @param id Entity ID
   */
  async delete(id: number): Promise<void> {
    return this.executeInTransaction(async (queryRunner: QueryRunner) => {
      const entity = await this.repository.findOne({ where: { id } as any })

      if (!entity) {
        throw new Error(`Entity with ID ${id} not found`)
      }

      await this.beforeDelete(queryRunner, entity)

      await queryRunner.manager.delete(this.repository.target, id)

      await this.afterDelete(queryRunner, entity)
    })
  }

  /**
   * Find an entity by ID
   * @param id Entity ID
   * @param options Additional find options
   * @returns Found entity or null
   */
  async findOne(id: number, options?: FindOneOptions<T>): Promise<T> {
    return await this.repository.findOne({
      ...options,
      where: {
        ...options?.where,
        id: id,
      } as any,
    } as FindOneOptions<T>)
  }

  /**
   * Find all entities with pagination support
   * @param options Find options
   * @returns Array of entities and count
   */
  async findAllWithPagination(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return await this.repository.findAndCount(options)
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find()
  }

  /**
   * Find entities with pagination, sorting and filtering
   * @param query Pagination and filtering parameters
   * @param baseQueryCallback Function to customize the query
   * @returns Array of entities and count
   */
  async findPaginated(
    query: PagedSortedAndFilteredResultQuery,
    baseQueryCallback?: (qb: any) => any,
  ): Promise<[T[], number]> {
    const entityMetadata = this.repository.metadata
    const entityName = entityMetadata.name
    let qb = this.repository.createQueryBuilder(entityName.toLowerCase())

    if (baseQueryCallback) {
      qb = baseQueryCallback(qb)
    }

    const sortField = query.sorting || 'id'
    const sortOrder = query.order && query.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

    if (query.page < 1) {
      query.page = 1
    }

    query.page = query.page - 1

    return await qb
      .orderBy(`${entityName.toLowerCase()}.${sortField}`, sortOrder)
      .skip(query.page * query.pageSize || 0)
      .take(query.pageSize || 10)
      .getManyAndCount()
  }

  /**
   * Count all entities
   * @returns Number of entities
   */
  async count(): Promise<number> {
    return await this.repository.count()
  }
}
