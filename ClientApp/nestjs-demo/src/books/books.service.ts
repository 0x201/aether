import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BookQuery } from './queries/book.query';
import { CreateBookCommand } from './commands/create-book.command';
import { UpdateBookCommand } from './commands/update-book.command';
import { Book } from './entities/book.entity';
import { BookAuthor } from './entities/book-author.entity';
import { Author } from 'src/authors/entities/author.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    private dataSource: DataSource
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
      const bookAuthorsToSave: BookAuthor[] = [];

      for (const command of createBookCommands) {
        const currentAuthorIds = command.authorIds.map(authorId => authorMap.get(authorId));
        if (!currentAuthorIds || currentAuthorIds.length === 0) {
          throw new Error(`Authors with IDs ${command.authorIds} not found.`);
        }

        const book = new Book();
        book.title = command.title;
        book.publishDate = command.publishDate;
        book.price = command.price;
        book.description = command.description;
        book.isbn = command.isbn;
        booksToSave.push(book);

        command.authorIds.forEach((authorId) => {
          bookAuthorsToSave.push({
            bookId: -1, // placeholder, will be replaced
            authorId: authorId,
          } as BookAuthor);
        });
      }

      const savedBooks = await queryRunner.manager.save(booksToSave);

      savedBooks.forEach((book, index) => {
        bookAuthorsToSave[index].bookId = book.id;
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

  async create(command: CreateBookCommand) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let booksToAdd: Book[] = [];
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
      book.publishDate = command.publishDate;
      book.price = command.price;
      book.description = command.description;
      book.isbn = command.isbn;

      command.authorIds.forEach((authorId) => {
        bookAuthorsToSave.push({
          bookId: null!,
          authorId: authorId,
        } as BookAuthor);
      });

      const savedBooks = await queryRunner.manager.save(booksToAdd);

      savedBooks.forEach((book, index) => {
        bookAuthorsToSave[index].bookId = book.id;
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

  async findAll(query: BookQuery): Promise<[Book[], number]> {
    let qb = this.bookRepository
      .createQueryBuilder('book')
      .innerJoin('book.author', 'author');
    if (query.filter) {
      qb = qb.andWhere('book.title like :title', { title: query.filter + '%' });
    }
    if (query.startDate && query.endDate) {
      qb = qb.andWhere('book.publishDate BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
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
    return await this.bookRepository.findOne({ where: { id: id } });
  }

  async update(id: number, command: UpdateBookCommand) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let book = await queryRunner.manager.findOne(Book, { where: { id: id } });
      if (!book) {
        throw new Error(`Book with id ${id} not found`);
      }
      book.title = command.title;
      book.publishDate = command.publishDate;

      const authors = await queryRunner.manager.find(Author, { where: { id: In(command.authorIds) } });
      if (!authors || authors.length === 0) {
        throw new Error(`Author with IDs ${command.authorIds} not found`);
      }

      await queryRunner.manager.delete(BookAuthor, { where: { bookId: book.id, authorId: In(command.authorIds) } })

      const newBookAuthors = command.authorIds.map((authorId) =>
        queryRunner.manager.create(BookAuthor, {
          bookId: book.id,
          authorId: authorId,
        })
      );
      await this.bookRepository.save(book);
      await queryRunner.manager.save(newBookAuthors);

    } catch (error) {
      await queryRunner.rollbackTransaction();
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
