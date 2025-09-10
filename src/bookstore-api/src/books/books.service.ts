import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BookQuery } from './queries/book.query';
import { CreateBookCommand } from './commands/create-book.command';
import { UpdateBookCommand } from './commands/update-book.command';
import { Book } from './entities/book.entity';
import { BookAuthor } from './entities/book-author.entity';
import { Author } from '../authors/entities/author.entity';
import { CurrentUser } from 'src/shared/current-user.service';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    private dataSource: DataSource,
    private readonly currentUser: CurrentUser
  ) { }

  async createMany(createBookCommands: CreateBookCommand[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const authorIds = [...new Set(createBookCommands.flatMap(x => x.authorIds))];

      const authors = await queryRunner.manager.find(Author, { where: { id: In(authorIds) } });

      const authorMap = new Map(authors.map(a => [a.id, a]));

      const booksToSave: Book[] = [];

      for (const command of createBookCommands) {
        const currentAuthorIds = command.authorIds.map(authorId => authorMap.get(authorId));
        if (!currentAuthorIds || currentAuthorIds.length === 0) {
          throw new Error(`Authors with IDs ${command.authorIds} not found.`);
        }
        const publishDate = command.publishDate ? new Date(command.publishDate).toISOString().split('T')[0] : null;

        const book = new Book();
        book.title = command.title;
        book.publishDate = publishDate;
        book.price = command.price;
        book.description = command.description;
        book.isbn = command.isbn;
        booksToSave.push(book);
      }

      const savedBooks = await queryRunner.manager.save(booksToSave);

      const bookAuthorsToSave: BookAuthor[] = [];
      savedBooks.forEach((book, index) => {
        const command = createBookCommands[index];
        command.authorIds.forEach((authorId) => {
          const bookAuthor = new BookAuthor();
          bookAuthor.bookId = book.id;
          bookAuthor.authorId = authorId;
          bookAuthorsToSave.push(bookAuthor);
        });
      });

      await queryRunner.manager.save(bookAuthorsToSave);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async create(command: CreateBookCommand): Promise<Book> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const authors = await queryRunner.manager.find(Author, { where: { id: In(command.authorIds) } });

      const authorMap = new Map(authors.map(a => [a.id, a]));

      const bookAuthorsToSave: BookAuthor[] = [];

      const currentAuthorIds = command.authorIds.map(authorId => authorMap.get(authorId));
      if (!currentAuthorIds || currentAuthorIds.length === 0) {
        throw new Error(`Authors with IDs ${command.authorIds} not found.`);
      }

      const book = new Book();
      book.title = command.title;
      book.publishDate = command.publishDate ? new Date(command.publishDate).toISOString().split('T')[0] : null;
      book.price = command.price;
      book.description = command.description;
      book.isbn = command.isbn;

      const username = this.currentUser.getUsername();

      book.createdBy = username;
      book.lastModifiedBy = username;

      const savedBook = await queryRunner.manager.save(book);

      command.authorIds.forEach((authorId) => {
        const bookAuthor = new BookAuthor();
        bookAuthor.bookId = savedBook.id;
        bookAuthor.authorId = authorId;
        bookAuthorsToSave.push(bookAuthor);
      });

      await queryRunner.manager.save(bookAuthorsToSave);

      await queryRunner.commitTransaction();
      return savedBook;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: BookQuery): Promise<[Book[], number]> {
    let qb = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.bookAuthors', 'bookAuthor')
      .leftJoinAndSelect('bookAuthor.author', 'author');
    if (query.filter) {
      qb = qb.andWhere('book.title like :title', { title: query.filter + '%' });
    }
    if (query.startDate && query.endDate) {
      qb = qb.andWhere('book.createdTime >= :startDate', { startDate: query.startDate });
      qb = qb.andWhere('book.createdTime <= :endDate', { endDate: query.endDate });
    }
    if (query.authorId) {
      qb = qb.andWhere('book.authorId=:authorId', {
        authorId: query.authorId
      })
    }

    return await qb
      .orderBy(query.sorting, query.order === 'asc' ? 'ASC' : 'DESC')
      .skip(query.skipCount)
      .take(query.maxResultCount)
      .getManyAndCount();
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({
      relations: ['bookAuthors', 'bookAuthors.author'],
      where: { id: id }
    });
    return book;
  }

  async update(id: number, command: UpdateBookCommand): Promise<Book> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let book = await queryRunner.manager.findOne(Book, { where: { id: id } });
      if (!book) {
        throw new Error(`Book with id ${id} not found`);
      }
      book.title = command.title;
      book.publishDate = command.publishDate ? new Date(command.publishDate).toISOString().split('T')[0] : null;
      book.price = command.price;

      const authors = await queryRunner.manager.find(Author, { where: { id: In(command.authorIds) } });
      if (!authors || authors.length === 0) {
        throw new Error(`Author with IDs ${command.authorIds} not found`);
      }

      await queryRunner.manager.delete(BookAuthor, { bookId: book.id })

      const newBookAuthors = command.authorIds.map((authorId) =>
        queryRunner.manager.create(BookAuthor, {
          bookId: book.id,
          authorId: authorId,
        })
      );

      book.lastModifiedBy = this.currentUser.getUsername();

      await queryRunner.manager.save(book);
      await queryRunner.manager.save(newBookAuthors);

      await queryRunner.commitTransaction();
      return book;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error("An error occurred while updating book.", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const bookToDelete = await this.bookRepository.findOne({
      where: { id: id },
    });
    await this.bookRepository.remove(bookToDelete);
  }

  async count(): Promise<number> {
    return await this.bookRepository.count();
  }
}