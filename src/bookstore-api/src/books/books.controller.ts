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
  HttpStatus,
} from '@nestjs/common';
import { PagedResult } from '../common/response/ListResultResponse';
import { BooksService } from './books.service';
import { BookDto } from './dtos/book.dto';
import { BookQuery } from './queries/book.query';
import { CreateBookCommand } from './commands/create-book.command';
import { UpdateBookCommand } from './commands/update-book.command';
import { plainToClass } from 'class-transformer';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/roles/role.decorator';
import { RoleEnum } from 'src/roles/role.enum';

@Controller('books')
@ApiTags('Books')
@ApiBearerAuth()
export class BooksController {
  constructor(private readonly booksService: BooksService,
  ) { }

  @Post()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({ type: CreateBookCommand })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Book created successfully', type: BookDto })
  async create(@Body() createBookDto: CreateBookCommand): Promise<BookDto> {
    const book = await this.booksService.create(createBookDto);
    return plainToClass(BookDto, book);
  }

  @Get()
  @ApiOperation({ summary: "Get books with paged list" })
  @ApiResponse({ status: HttpStatus.OK, description: "Return books with paged list", type: PagedResult<BookDto> })
  async findAll(
    @Query() query: BookQuery
  ): Promise<PagedResult<BookDto>> {
    const res = await this.booksService.findAll(query);
    const items: BookDto[] = res[0].map((x) => Object.assign(new BookDto(), x));
    return new PagedResult<BookDto>(items, res[1]);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return book by id', type: BookDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async findOne(@Param('id') id: number): Promise<BookDto> {
    const entity = await this.booksService.findOne(id);
    if (!entity) {
      throw new HttpException(`Cannot find the entity with id ${id}`, 404);
    }
    return plainToClass(BookDto, entity);
  }

  @Roles(RoleEnum.Admin)
  @Put(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiBody({ type: UpdateBookCommand })
  @ApiResponse({ status: HttpStatus.OK, description: 'Book updated successfully', type: BookDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async update(
    @Param('id') id: number,
    @Body() updateBookDto: UpdateBookCommand
  ): Promise<BookDto> {
    const book = await this.booksService.update(id, updateBookDto);
    return plainToClass(BookDto, book);
  }

  @Roles(RoleEnum.Admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Book deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async remove(@Param('id') id: number): Promise<void> {
    return await this.booksService.remove(id);
  }
}
