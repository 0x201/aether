import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';

import { Column, Entity, Index, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookAuthor } from './book-author.entity';

@Entity('Books')
@Index('IDX_BOOK_TITLE', ['title'], { unique: true })
@Index('IDX_BOOK_ISBN', ['isbn'], { unique: true })
export class Book extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Title', type: 'varchar', length: 512 })
  title: string;

  @Column({ name: 'Price', type: 'decimal', precision: 18, scale: 2 })
  price: number;

  @Column({ name: 'Isbn', type: 'varchar', length: 16 })
  isbn: string;

  @Column({
    name: 'Description',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  description: string;

  @Column({ name: 'PublishDate', type: 'varchar', length: 10, nullable: true })
  publishDate: string;

  @Column({ name: 'IsActive', default: true })
  isActive: boolean;

  @OneToMany(() => BookAuthor, (bookAuthor) => bookAuthor.book)
  bookAuthors: BookAuthor[];
}
