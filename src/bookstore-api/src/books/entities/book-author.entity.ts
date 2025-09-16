import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Book } from './book.entity';
import { Author } from '../../authors/entities/author.entity';

@Entity('BookAuthor')
@Index("IDX_BookAuthor_BookId_AuthorId", ['bookId', 'authorId'], { unique: true })
export class BookAuthor {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ name: 'BookId' })
  bookId: number;

  @Column({ name: 'AuthorId' })
  authorId: number;

  @ManyToOne(() => Book, book => book.bookAuthors, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({name: 'BookId'})
  book: Book;

  @ManyToOne(() => Author, author => author.bookAuthors, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({name: 'AuthorId'})
  author: Author;
}
