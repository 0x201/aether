import { Injectable } from "@nestjs/common";
import { Repository, In, DataSource, SelectQueryBuilder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateRoleCommand } from "./commands/create-role.command.js";
import { UpdateRoleCommand } from "./commands/update-role.command.js";
import { Role } from "./entities/role.entity.js";
import { RoleQuery } from "./queries/role.query.js";
import { UserContextService } from "../shared/services/user-context.service.js";
import { GenericCrudAuditableService } from "@/src/common/services/generic-crud-auditable.service.js";
import { DateTimeService } from "@/src/shared/services/datetime.service.js";

@Injectable()
export class RolesService extends GenericCrudAuditableService<
  Role,
  CreateRoleCommand,
  UpdateRoleCommand
> {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    protected readonly dataSource: DataSource,
    protected readonly currentUser: UserContextService,
    protected readonly dateTimeService: DateTimeService,
  ) {
    super(roleRepository, dataSource, currentUser, dateTimeService);
  }

  protected mapCreateDtoToEntity(
    command: CreateRoleCommand,
    entity: Role,
  ): void {
    entity.name = command.name;
    entity.isActive = true;
  }

  protected mapUpdateDtoToEntity(
    command: UpdateRoleCommand,
    entity: Role,
  ): void {
    Object.assign(entity, {
      name: command.name ?? entity.name,
      isActive: command.isActive ?? entity.isActive,
    });
  }

  async findOneByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name: name } });
  }

  async findOne(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id: id } });
  }

  async findByNames(names: string[]): Promise<Role[]> {
    return this.roleRepository.find({ where: { name: In(names) } });
  }

  async findRoles(query: RoleQuery): Promise<[Role[], number]> {
    return this.findPaginated(query, (qb: SelectQueryBuilder<Role>) => {
      if (query.filter) {
        qb = qb.andWhere("role.name like :name", { name: `%${query.filter}%` });
      }

      if (query.startDate && query.endDate) {
        qb = qb.andWhere("role.createdTime >= :startDate", {
          startDate: query.startDate,
        });
        qb = qb.andWhere("role.createdTime <= :endDate", {
          endDate: query.endDate,
        });
      }

      return qb;
    });
  }

  async findAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  async findByIds(ids: number[]): Promise<Role[]> {
    return await this.roleRepository.findBy({ id: In(ids) });
  }
}
