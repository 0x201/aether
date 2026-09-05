import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PagedResult, Result } from "@/src/common/response/Result.js";
import { CreateAuthorCommand } from "./commands/create-author.command.js";
import { UpdateAuthorCommand as UpdateAuthorDto } from "./commands/update-author.command.js";
import { Author } from "./entities/author.entity.js";
import { GetAuthorsQuery } from "./queries/get-authors.query.js";
import { AuthorDto } from "./dtos/author.dto.js";
import { Roles } from "@/src/roles/role.decorator.js";
import { RoleEnum } from "@/src/roles/role.enum.js";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateAuthorDto } from "./dtos/create-author.dto.js";
import { GetAuthorQuery } from "./queries/get-author.query.js";
import { DeleteAuthorCommand } from "./commands/delete-author.command.js";

@Controller("authors")
@ApiTags("Authors")
@ApiBearerAuth()
export class AuthorsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: "Create a new book" })
  @ApiBody({ type: CreateAuthorDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Author created successfully",
    type: AuthorDto,
  })
  async create(@Body() createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
    const command = new CreateAuthorCommand(createAuthorDto);
    const author = (await this.commandBus.execute(command)) as Author;
    return this.mapAuthorToAuthorDto(author);
  }

  @Get()
  @ApiOperation({ summary: "Get authors with paged list" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return books with paged list",
    type: PagedResult<AuthorDto>,
  })
  async findAuthors(
    @Query() query: GetAuthorsQuery,
  ): Promise<PagedResult<Author>> {
    const [authors, totalCount] = (await this.queryBus.execute(query)) as [
      Author[],
      number,
    ];
    return new PagedResult<Author>(authors, totalCount);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an author by id" })
  @ApiParam({ name: "id", description: "Author id" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return author by id",
    type: AuthorDto,
  })
  async findOne(@Param("id") id: number) {
    const query = new GetAuthorQuery(id);
    const entity = (await this.queryBus.execute(query)) as Author;
    if (!entity) {
      throw new HttpException(`Cannot find the entity with id ${id}`, 404);
    }
    return Result.success(this.mapAuthorToAuthorDto(entity));
  }

  @Patch(":id")
  async update(
    @Param("id") id: number,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    const command = new UpdateAuthorDto(id, updateAuthorDto);
    return await this.commandBus.execute(command);
  }

  @Delete(":id")
  async remove(@Param("id") id: number) {
    const command = new DeleteAuthorCommand(id);
    return await this.commandBus.execute(command);
  }

  private mapAuthorToAuthorDto(entity: Author): AuthorDto {
    const dto = new AuthorDto();
    dto.id = entity.id;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.isActive = entity.isActive;
    return dto;
  }
}
