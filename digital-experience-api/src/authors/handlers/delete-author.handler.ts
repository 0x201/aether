import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"

import { AuthorsService } from "../authors.service.js"
import { DeleteAuthorCommand } from "../commands/delete-author.command.js"

@CommandHandler(DeleteAuthorCommand)
export class DeleteAuthorHandler implements ICommandHandler<DeleteAuthorCommand> {
  constructor(private authorService: AuthorsService) {}

  async execute(command: DeleteAuthorCommand): Promise<void> {
    await this.authorService.delete(command.id)
  }
}
