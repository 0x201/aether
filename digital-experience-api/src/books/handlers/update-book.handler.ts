import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"

import { BooksService } from "../books.service.js"
import { UpdateBookCommand } from "../commands/update-book.command.js"

@CommandHandler(UpdateBookCommand)
export class UpdateBookHandler implements ICommandHandler<UpdateBookCommand> {
  constructor(private bookService: BooksService) {}

  async execute(command: UpdateBookCommand): Promise<void> {
    const { id, ...updateData } = command
    await this.bookService.update(id, updateData)
  }
}
