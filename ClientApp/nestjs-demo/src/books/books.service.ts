import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorsService } from 'src/authors/authors.service';
import { DataSource, Repository } from 'typeorm';
import { BookQuery } from './queries/book.query';
import { CreateBookCommand } from './commands/create-book.command';
import { UpdateBookCommand } from './commands/update-book.command';
import { Book } from './entities/book.entity';
import { plainToClass } from 'class-transformer';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    private dataSource: DataSource,
    private authorService: AuthorsService,
  ) { }

  async createMany(createBookCommands: CreateBookCommand[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const author = await this.authorService.findOne(createBookCommands[0].authorId);
    try {
      let booksToAdd: Book[] = [];
      createBookCommands.map((x) => {
        const bookToAdd = new Book();
        bookToAdd.title = x.title;
        bookToAdd.publishDate = x.publishDate;
        bookToAdd.price = x.price;
        bookToAdd.description = x.description;
        bookToAdd.isbn = x.isbn;
        bookToAdd.author = author;
        booksToAdd.push(bookToAdd);
      });
      await queryRunner.manager.save(booksToAdd);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async create(createBookCommand: CreateBookCommand) {
    let bookToInsert = plainToClass(Book, createBookCommand);
    //bookToInsert.title = createBookDto.title;
    //bookToInsert.publishDate = createBookDto.publishDate;
    const author = await this.authorService.findOne(createBookCommand.authorId);
    bookToInsert.author = author;
    bookToInsert = await this.bookRepository.save(bookToInsert);
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

  async update(id: number, updateBookDto: UpdateBookCommand) {
    let book = await this.bookRepository.findOne({ where: { id: id } });
    book = Object.assign(book, updateBookDto);
    // book.title = updateBookDto.title;
    // book.publishDate = updateBookDto.publishDate;
    const author = await this.authorService.findOne(updateBookDto.authorId);
    book.author = author;
    book = await this.bookRepository.save(book);
  }

  async remove(id: number) {
    const bookToDelete = await this.bookRepository.findOne({
      where: { id: id },
    });
    await this.bookRepository.remove(bookToDelete);
  }
}
