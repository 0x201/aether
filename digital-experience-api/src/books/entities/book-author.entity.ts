import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Book } from './book.entity.js'
import { Author } from '../../authors/entities/author.entity.js'

@Entity('book_author', { schema: 'bookstore' })
@Index('book_author_book_id_author_id_idx', ['bookId', 'authorId'], { unique: true })
export class BookAuthor {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'book_author_pk' })
  id: number

  @Column({ name: 'book_id' })
  bookId: number

  @Column({ name: 'author_id' })
  authorId: number

  @ManyToOne(() => Book, (book) => book.bookAuthors, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'book_id' })
  book: Book

  @ManyToOne(() => Author, (author) => author.bookAuthors, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'author_id' })
  author: Author
}
