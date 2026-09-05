import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity.js'

import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { BookAuthor } from './book-author.entity.js'

@Entity('books', { schema: 'bookstore' })
@Index('books_title_idx', ['title'], { unique: true })
@Index('books_isbn_idx', ['isbn'], { unique: true })
export class Book extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'books_pk' })
  id: number

  @Column({ name: 'title', length: 512 })
  title: string

  @Column({ name: 'price', type: 'decimal', precision: 18, scale: 2 })
  price: number

  @Column({ name: 'isbn', length: 16 })
  isbn: string

  @Column({
    name: 'description',
    length: 2048,
    nullable: true,
  })
  description: string

  @Column({ name: 'publish_date', length: 10, nullable: true })
  publishDate: string

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @OneToMany(() => BookAuthor, (bookAuthor) => bookAuthor.book)
  bookAuthors: BookAuthor[]
}
