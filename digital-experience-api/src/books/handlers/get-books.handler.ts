import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetBooksQuery } from "../queries/get-books.query.js";
import { BooksService } from "../books.service.js";
import { Book } from "../entities/book.entity.js";

@QueryHandler(GetBooksQuery)
export class GetBooksHandler implements IQueryHandler<GetBooksQuery> {
  constructor(private bookService: BooksService) {}

  async execute(query: GetBooksQuery): Promise<[Book[], number]> {
    const books = await this.bookService.findBooks(query);

    return books;
  }
}
