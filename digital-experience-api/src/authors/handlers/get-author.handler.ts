import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetAuthorQuery } from "../queries/get-author.query.js";
import { AuthorsService } from "../authors.service.js";
import { Author } from "../entities/author.entity.js";

@QueryHandler(GetAuthorQuery)
export class GetAuthorHandler implements IQueryHandler<GetAuthorQuery> {
  constructor(private authorService: AuthorsService) {}

  async execute(query: GetAuthorQuery): Promise<Author | null> {
    const book = await this.authorService.findOne(query.id);

    return book;
  }
}
