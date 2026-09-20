import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"

import { BooksService } from "../books.service.js"
import { DeleteBookCommand } from "../commands/delete-book.command.js"

@CommandHandler(DeleteBookCommand)
export class DeleteBookHandler implements ICommandHandler<DeleteBookCommand> {
  constructor(private bookService: BooksService) {}

  async execute(command: DeleteBookCommand): Promise<void> {
    const { bookId } = command
    await this.bookService.delete(bookId)
  }
}
