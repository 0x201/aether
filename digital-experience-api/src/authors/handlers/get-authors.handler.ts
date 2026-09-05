import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetAuthorsQuery } from "../queries/get-authors.query.js";
import { AuthorsService } from "../authors.service.js";
import { Author } from "../entities/author.entity.js";

@QueryHandler(GetAuthorsQuery)
export class GetAuthorsHandler implements IQueryHandler<GetAuthorsQuery> {
  constructor(private authorsService: AuthorsService) {}

  async execute(query: GetAuthorsQuery): Promise<[Author[], number]> {
    const books = await this.authorsService.findAuthors(query);

    return books;
  }
}
