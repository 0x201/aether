import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';

import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookAuthor } from './book-author.entity';

@Entity('books')
@Index('IDX_BOOK_TITLE', ['title'], { unique: true })
@Index('IDX_BOOK_ISBN', ['isbn'], { unique: true })
export class Book extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 512 })
  title: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'varchar', length: 16, nullable: false })
  isbn: string;

  @Column({ type: 'varchar', length: 2048 })
  description: string;

  // 1999-01-01
  @Column({ type: 'varchar', length: 10 })
  publishDate: string;

  @Column({ default: true, nullable: false })
  isActive: boolean;

  @OneToMany(() => BookAuthor, ba => ba.book)
  bookAuthors: BookAuthor[];
}
