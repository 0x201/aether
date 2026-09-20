import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"

import { BooksService } from "../books.service.js"
import { Book } from "../entities/book.entity.js"
import { GetBookQuery } from "../queries/get-book.query.js"

@QueryHandler(GetBookQuery)
export class GetBookHandler implements IQueryHandler<GetBookQuery> {
  constructor(private bookService: BooksService) {}

  async execute(query: GetBookQuery): Promise<Book | null> {
    const book = await this.bookService.findOne(query.bookId)

    return book
  }
}
