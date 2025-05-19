import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuthorCommand } from './commands/create-author.command';
import { UpdateAuthorCommand } from './commands/update-author.command';
import { Author } from './entities/author.entity';
import { AuthorQuery } from './queries/author.query';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author) private authorRepository: Repository<Author>
  ) { }

  async create(createAuthorCommand: CreateAuthorCommand) {
    let author = new Author();
    author = Object.assign(author, createAuthorCommand);
    await this.authorRepository.save(author);
  }

  async createMany(createAuthorsCommand: CreateAuthorCommand[]) {
    let authorsToAdd: Author[] = [];
    createAuthorsCommand.forEach((command) => {
      let author = new Author();
      author = Object.assign(author, command);
      authorsToAdd.push(author);
    })

    await this.authorRepository.save(authorsToAdd);
  }

  async findAll(query: AuthorQuery): Promise<[Author[], number]> {
    let qb = this.authorRepository.createQueryBuilder('author');
    if (query.filter) {
      qb = qb.where('author.name like :name', { name: query.filter + '%' });
    }
    return await qb
      .orderBy(query.sorting, query.order === 'asc' ? 'ASC' : 'DESC')
      .getManyAndCount();
  }

  async findOne(id: number): Promise<Author> {
    return await this.authorRepository.findOne({ where: { id: id } });
  }

  async update(id: number, updateAuthorDto: UpdateAuthorCommand) {
    const originalAuthor = await this.authorRepository.findOne({
      where: { id: id },
    });
    const updatedAuthor = Object.assign(originalAuthor, updateAuthorDto);
    await this.authorRepository.save(updatedAuthor);
  }

  async remove(id: number): Promise<void> {
    const authorToDelete = await this.authorRepository.findOne({
      where: { id: id },
    });
    await this.authorRepository.remove(authorToDelete);
  }
}
