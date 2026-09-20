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
  Res,
} from "@nestjs/common"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger"
import type { Response } from "express"

import { AuthorDto } from "@/src/authors/dtos/author.dto.js"
import { Roles } from "@/src/roles/role.decorator.js"
import { RoleEnum } from "@/src/roles/role.enum.js"

import { Result, PagedResult } from "../common/response/Result.js"
import { CreateBookCommand } from "./commands/create-book.command.js"
import { DeleteBookCommand } from "./commands/delete-book.command.js"
import { UpdateBookCommand } from "./commands/update-book.command.js"
import { BookDto } from "./dtos/book.dto.js"
import { CreateBookDto } from "./dtos/create-book.dto.js"
import { UpdateBookDto } from "./dtos/update-book.dto.js"
import { Book } from "./entities/book.entity.js"
import { GetBookQuery } from "./queries/get-book.query.js"
import { GetBooksQuery } from "./queries/get-books.query.js"

@Controller("books")
@ApiTags("Books")
@ApiBearerAuth()
export class BooksController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: "Create a new book" })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Book created successfully",
  })
  async create(@Body() createBookDto: CreateBookDto, @Res() res: Response): Promise<void> {
    const command = new CreateBookCommand(createBookDto)
    const bookId = (await this.commandBus.execute(command)) as number
    res.status(HttpStatus.CREATED).location(`/api/books/${bookId}`).send()
  }

  @Get()
  @ApiOperation({ summary: "Get books with paged list" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return books with paged list",
    type: PagedResult<BookDto>,
  })
  async findBooks(@Query() query: GetBooksQuery): Promise<PagedResult<BookDto>> {
    const [books, totalCount] = (await this.queryBus.execute(query)) as [Book[], number]
    const data: BookDto[] = books.map((book) => this.mapBookToBookDto(book))
    return PagedResult.success(data, totalCount)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a book by id" })
  @ApiParam({ name: "id", description: "Book id" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return book by id",
    type: Result<BookDto>,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Book not found" })
  async findOne(@Param("id") id: number): Promise<Result<BookDto>> {
    const entity = (await this.queryBus.execute(new GetBookQuery(id))) as Book
    if (!entity) {
      throw new HttpException(`Cannot find the entity with id ${id}`, 404)
    }
    return Result.success(this.mapBookToBookDto(entity))
  }

  @Roles(RoleEnum.Admin)
  @Put(":id")
  @ApiOperation({ summary: "Update a book" })
  @ApiParam({ name: "id", description: "Book id" })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Book updated successfully",
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Book not found" })
  async update(@Param("id") id: number, @Body() updateData: UpdateBookDto): Promise<void> {
    const command = new UpdateBookCommand(id, updateData)
    await this.commandBus.execute(command)
  }

  @Roles(RoleEnum.Admin)
  @Delete(":id")
  @ApiOperation({ summary: "Delete a book" })
  @ApiParam({ name: "id", description: "Book id" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Book deleted successfully",
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Book not found" })
  async remove(@Param("id") id: number): Promise<void> {
    const command = new DeleteBookCommand(id)
    await this.commandBus.execute(command)
  }

  private mapBookToBookDto(book: Book): BookDto {
    const dto = new BookDto()
    dto.id = book.id
    dto.title = book.title
    dto.description = book.description
    dto.isbn = book.isbn
    dto.price = book.price
    dto.publishDate = book.publishDate
    dto.isActive = book.isActive
    dto.authors = book.bookAuthors.map((bookAuthor) => {
      const authorDto = new AuthorDto()
      authorDto.id = bookAuthor.author.id
      authorDto.firstName = bookAuthor.author.firstName
      authorDto.lastName = bookAuthor.author.lastName
      authorDto.isActive = bookAuthor.author.isActive
      return authorDto
    })
    return dto
  }
}
