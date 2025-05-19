import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PagedResultResponse } from 'src/common/response/ListResultResponse';
import { AuthorsService } from './authors.service';
import { CreateAuthorCommand } from './commands/create-author.command';
import { UpdateAuthorCommand } from './commands/update-author.command';
import { Author } from './entities/author.entity';
import { AuthorQuery } from './queries/author.query';

@Controller('authors')
@ApiTags('Authors')
@ApiBearerAuth()
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  create(@Body() createAuthorCommand: CreateAuthorCommand) {
    console.log('createAuthorCommand: ', createAuthorCommand);
    return this.authorsService.create(createAuthorCommand);
  }

  @Get()
  async findAll(
    @Query() query: AuthorQuery,
  ): Promise<PagedResultResponse<Author>> {
    const res = await this.authorsService.findAll(query);
    return new PagedResultResponse<Author>(res[0], res[1]);
  }

  @Get(':id')
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
    return this.authorsService.remove(id);
  }
}
