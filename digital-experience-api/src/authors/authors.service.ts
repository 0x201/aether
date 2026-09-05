import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { CreateAuthorCommand } from "./commands/create-author.command.js";
import { UpdateAuthorCommand } from "./commands/update-author.command.js";
import { Author } from "./entities/author.entity.js";
import { GetAuthorsQuery } from "./queries/get-authors.query.js";
import { UserContextService } from "@/src/shared/services/user-context.service.js";
import { GenericCrudAuditableService } from "@/src/common/services/generic-crud-auditable.service.js";
import { DateTimeService } from "@/src/shared/services/datetime.service.js";
import { CreateAuthorDto } from "./dtos/create-author.dto.js";
import { UpdateAuthorDto } from "./dtos/update-author.dto.js";

@Injectable()
export class AuthorsService extends GenericCrudAuditableService<
  Author,
  CreateAuthorDto,
  UpdateAuthorDto
> {
  protected readonly logger = new Logger(AuthorsService.name);

  constructor(
    @InjectRepository(Author) private authorRepository: Repository<Author>,
    protected readonly dataSource: DataSource,
    protected readonly dateTimeService: DateTimeService,
    protected readonly currentUser: UserContextService,
  ) {
    super(authorRepository, dataSource, currentUser, dateTimeService);
  }

  protected mapCreateDtoToEntity(
    command: CreateAuthorCommand,
    entity: Author,
  ): void {
    entity.firstName = command.firstName;
    entity.lastName = command.lastName;
  }

  protected mapUpdateDtoToEntity(
    command: UpdateAuthorCommand,
    entity: Author,
  ): void {
    Object.assign(entity, {
      firstName: command.firstName ?? entity.firstName,
      lastName: command.lastName ?? entity.lastName,
      isActive: command.isActive ?? entity.isActive,
    });
  }
  async findAuthors(query: GetAuthorsQuery): Promise<[Author[], number]> {
    return this.findPaginated(query, (qb: SelectQueryBuilder<Author>) => {
      if (query.filter) {
        qb = qb.where(
          "author.firstName like :name OR author.lastName like :name",
          {
            name: `%${query.filter}%`,
          },
        );
      }
      return qb;
    });
  }

  async findOne(id: number): Promise<Author | null> {
    return await this.authorRepository.findOne({ where: { id: id } });
  }
}
