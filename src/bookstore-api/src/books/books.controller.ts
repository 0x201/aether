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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/roles/role.decorator';
import { RoleEnum } from 'src/roles/role.enum';
import { Book } from './entities/book.entity';
import { AuthorDto } from 'src/authors/dtos/author.dto';

@Controller('books')
@ApiTags('Books')
@ApiBearerAuth()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({ type: CreateBookCommand })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Book created successfully',
    type: BookDto,
  })
  async create(@Body() createBookDto: CreateBookCommand): Promise<BookDto> {
    const book = await this.booksService.insert(createBookDto);
    return this.mapBookToBookDto(book);
  }

  @Get()
  @ApiOperation({ summary: 'Get books with paged list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return books with paged list',
    type: PagedResult<BookDto>,
  })
  async findBooks(@Query() query: BookQuery): Promise<PagedResult<BookDto>> {
    const [books, totalCount] = await this.booksService.findBooks(query);
    const items: BookDto[] = books.map((book) => this.mapBookToBookDto(book));
    return new PagedResult<BookDto>(items, totalCount);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return book by id',
    type: BookDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async findOne(@Param('id') id: number): Promise<BookDto> {
    const entity = await this.booksService.findOne(id);
    if (!entity) {
      throw new HttpException(`Cannot find the entity with id ${id}`, 404);
    }
    return this.mapBookToBookDto(entity);
  }

  @Roles(RoleEnum.Admin)
  @Put(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiBody({ type: UpdateBookCommand })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book updated successfully',
    type: BookDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async update(
    @Param('id') id: number,
    @Body() updateBookDto: UpdateBookCommand,
  ): Promise<BookDto> {
    const book = await this.booksService.update(id, updateBookDto);
    return this.mapBookToBookDto(book);
  }

  @Roles(RoleEnum.Admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async remove(@Param('id') id: number): Promise<void> {
    return await this.booksService.delete(id);
  }

  private mapBookToBookDto(book: Book): BookDto {
    const dto = new BookDto();
    dto.id = book.id;
    dto.title = book.title;
    dto.description = book.description;
    dto.isbn = book.isbn;
    dto.price = book.price;
    dto.publishDate = book.publishDate;
    dto.isActive = book.isActive;
    dto.authors = book.bookAuthors.map((bookAuthor) => {
      const authorDto = new AuthorDto();
      authorDto.id = bookAuthor.author.id;
      authorDto.firstName = bookAuthor.author.firstName;
      authorDto.lastName = bookAuthor.author.lastName;
      return authorDto;
    });
    return dto;
  }
}
