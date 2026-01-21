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
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PagedResult } from 'src/common/response/Result';
import { AuthorsService } from './authors.service';
import { CreateAuthorCommand } from './commands/create-author.command';
import { UpdateAuthorCommand } from './commands/update-author.command';
import { Author } from './entities/author.entity';
import { AuthorQuery } from './queries/author.query';
import { AuthorDto } from './dtos/author.dto';
import { Roles } from 'src/roles/role.decorator';
import { RoleEnum } from 'src/roles/role.enum';

@Controller('authors')
@ApiTags('Authors')
@ApiBearerAuth()
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) { }

  @Post()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({ type: CreateAuthorCommand })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Author created successfully',
    type: AuthorDto,
  })
  async create(@Body() createAuthorCommand: CreateAuthorCommand): Promise<AuthorDto> {
    const author = await this.authorsService.insert(createAuthorCommand);
    return this.mapAuthorToAuthorDto(author);
  }

    @Get("/all")
    @ApiOperation({ summary: 'Get all authors' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Return books list',
      type: Array<AuthorDto>,
    })
    async findAllBooks(): Promise<AuthorDto[]> {
      const authors = await this.authorsService.findAll();
      const dtos: AuthorDto[] = authors.map((author) => this.mapAuthorToAuthorDto(author));
      return dtos;
    }

  @Get()
  @ApiOperation({ summary: 'Get authors with paged list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return books with paged list',
    type: PagedResult<AuthorDto>,
  })
  async findAuthors(@Query() query: AuthorQuery): Promise<PagedResult<Author>> {
    const res = await this.authorsService.findAuthors(query);
    return new PagedResult<Author>(res[0], res[1]);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an author by id' })
  @ApiParam({ name: 'id', description: 'Author id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return author by id',
    type: AuthorDto,
  })
  findOne(@Param('id') id: number) {
    return this.authorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateAuthorDto: UpdateAuthorCommand,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.authorsService.delete(id);
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
