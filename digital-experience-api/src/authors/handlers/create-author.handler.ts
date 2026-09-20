import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs"

import { AuthorsService } from "../authors.service.js"
import { CreateAuthorCommand } from "../commands/create-author.command.js"
import { Author } from "../entities/author.entity.js"
import { AuthorCreatedEevent } from "../events/author-created.event.js"

@CommandHandler(CreateAuthorCommand)
export class CreateAuthorHandler implements ICommandHandler<CreateAuthorCommand> {
  constructor(
    private eventBus: EventBus,
    private authorService: AuthorsService,
  ) {}

  async execute(command: CreateAuthorCommand): Promise<Author> {
    const entity = await this.authorService.insert(command)

    this.eventBus.publish(new AuthorCreatedEevent(entity.id, entity.firstName, entity.lastName))

    return entity
  }
}
