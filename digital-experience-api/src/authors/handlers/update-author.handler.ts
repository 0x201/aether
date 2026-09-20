import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"

import { AuthorsService } from "../authors.service.js"
import { UpdateAuthorCommand } from "../commands/update-author.command.js"

@CommandHandler(UpdateAuthorCommand)
export class UpdateAuthorHandler implements ICommandHandler<UpdateAuthorCommand> {
  constructor(private authorService: AuthorsService) {}

  async execute(command: UpdateAuthorCommand): Promise<void> {
    const { id, ...updateData } = command
    await this.authorService.update(id, updateData)
  }
}
