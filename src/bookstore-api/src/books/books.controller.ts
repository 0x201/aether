import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpException,
} from '@nestjs/common';
import { PagedResult } from '../common/response/ListResultResponse';
import { BooksService } from './books.service';
import { BookDto } from './dtos/book.dto';
import { BookQuery } from './queries/book.query';
import { CreateBookCommand } from './commands/create-book.command';
import { UpdateBookCommand } from './commands/update-book.command';
import { plainToClass } from 'class-transformer';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/roles/role.decorator';
import { RoleEnum } from 'src/roles/role.enum';

@Controller('books')
@ApiTags('Books')
@ApiBearerAuth()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(RoleEnum.Admin)
  create(@Body() createBookDto: CreateBookCommand) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @ApiResponse({ type: PagedResult<BookDto> })
  async findAll(
    @Query() query: BookQuery,
  ): Promise<PagedResult<BookDto>> {
    const res = await this.booksService.findAll(query);
    const items: BookDto[] = res[0].map((x) => Object.assign(new BookDto(), x));
    return new PagedResult<BookDto>(items, res[1]);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: BookDto })
  async findOne(@Param('id') id: number) {
    const entity = await this.booksService.findOne(id);
    if (!entity) {
      throw new HttpException(`Cannot find the entity with id ${id}`, 404);
    }
    return plainToClass(BookDto, entity);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateBookDto: UpdateBookCommand) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.booksService.remove(id);
  }
}
