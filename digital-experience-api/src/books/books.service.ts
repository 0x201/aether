import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { GetBooksQuery } from "./queries/get-books.query.js";
import { CreateBookCommand } from "./commands/create-book.command.js";
import { UpdateBookCommand } from "./commands/update-book.command.js";
import { Book } from "./entities/book.entity.js";
import { BookAuthor } from "./entities/book-author.entity.js";
import { Author } from "../authors/entities/author.entity.js";
import { UserContextService } from "@/src/shared/services/user-context.service.js";
import { GenericCrudAuditableService } from "@/src/common/services/generic-crud-auditable.service.js";
import { DateTimeService } from "@/src/shared/services/datetime.service.js";
import { CreateBookDto } from "./dtos/create-book.dto.js";
import { UpdateBookDto } from "./dtos/update-book.dto.js";

@Injectable()
export class BooksService extends GenericCrudAuditableService<
  Book,
  CreateBookDto,
  UpdateBookDto
> {
  protected readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    protected readonly dataSource: DataSource,
    protected readonly currentUser: UserContextService,
    protected readonly dateTimeService: DateTimeService,
  ) {
    super(bookRepository, dataSource, currentUser, dateTimeService);
  }

  protected mapCreateDtoToEntity(
    command: CreateBookCommand,
    entity: Book,
  ): void {
    entity.title = command.title;
    entity.publishDate = new Date(command.publishDate).toISOString().split("T")[0]
    entity.price = command.price;
    entity.description = command.description;
    entity.isbn = command.isbn;
  }

  protected mapUpdateDtoToEntity(
    command: UpdateBookCommand,
    entity: Book,
  ): void {
    const publishDate = command.publishDate
      ? new Date(command.publishDate).toISOString().split("T")[0]
      : null;

    Object.assign(entity, {
      title: command.title ?? entity.title,
      publishDate: publishDate ?? entity.publishDate,
      price: command.price ?? entity.price,
      description: command.description ?? entity.description,
      isbn: command.isbn ?? entity.isbn,
      isActive: command.isActive ?? entity.isActive,
    });
  }

  protected async afterCreate(
    queryRunner: QueryRunner,
    command: CreateBookCommand,
    entity: Book,
  ): Promise<void> {
    if (command.authors && command.authors.length > 0) {
      const authors: Author[] = await queryRunner.manager
        .createQueryBuilder(Author, "author")
        .where("author.id IN (:...authorIds)", {
          authorIds: command.authors.map((author) => author.id),
        })
        .getMany();

      const bookAuthorsToSave: BookAuthor[] = authors.map((author) => {
        const bookAuthor = new BookAuthor();
        bookAuthor.bookId = entity.id;
        bookAuthor.authorId = author.id;
        return bookAuthor;
      });

      await queryRunner.manager.save<BookAuthor>(bookAuthorsToSave);
    }
    await super.afterCreate(queryRunner, command, entity);
  }

  protected async afterUpdate(
    queryRunner: QueryRunner,
    command: UpdateBookCommand,
    entity: Book,
  ): Promise<void> {
    if (command.authors) {
      await queryRunner.manager
        .createQueryBuilder(BookAuthor, "bookAuthor")
        .where("bookId = :bookId", { bookId: entity.id })
        .delete()
        .execute();

      if (command.authors.length > 0) {
        const bookAuthorsToAdd = command.authors.map((author) => {
          const bookAuthor = new BookAuthor();
          bookAuthor.bookId = entity.id;
          bookAuthor.authorId = author.id;
          return bookAuthor;
        });

        await queryRunner.manager.save<BookAuthor>(bookAuthorsToAdd);
      }
    }
    await super.afterUpdate(queryRunner, command, entity);
  }

  async findBooks(query: GetBooksQuery): Promise<[Book[], number]> {
    return this.findPaginated(query, (qb: SelectQueryBuilder<Book>) => {
      qb = qb
        .leftJoinAndSelect("book.bookAuthors", "bookAuthor")
        .leftJoinAndSelect("bookAuthor.author", "author");

      if (query.filter) {
        qb = qb.andWhere("book.title like :title", {
          title: `%${query.filter}%`,
        });
      }

      if (query.startDate && query.endDate) {
        qb = qb.andWhere("book.createdTime >= :startDate", {
          startDate: query.startDate,
        });
        qb = qb.andWhere("book.createdTime <= :endDate", {
          endDate: query.endDate,
        });
      }

      if (query.authorId) {
        qb = qb.where("author.id = :authorId", { authorId: query.authorId });
      }

      return qb;
    });
  }

  async findOne(id: number): Promise<Book | null> {
    const book = await this.bookRepository.findOne({
      relations: {
        bookAuthors: {
          author: true,
        },
      },
      where: { id: id },
    });
    return book;
  }
}
