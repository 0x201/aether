import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { CreateBookCommand } from "../commands/create-book.command.js";
import { BookCreatedEevent } from "../events/book-created.event.js";
import { BooksService } from "../books.service.js";

@CommandHandler(CreateBookCommand)
export class CreateBookHandler implements ICommandHandler<CreateBookCommand> {
  constructor(
    private eventBus: EventBus,
    private bookService: BooksService,
  ) {}

  async execute(command: CreateBookCommand): Promise<number> {
    const { title, isbn, publishDate, price } = command;

    const entity = await this.bookService.insert(command);

    this.eventBus.publish(
      new BookCreatedEevent(entity.id, title, isbn, publishDate, price),
    );

    return entity.id;
  }
}
