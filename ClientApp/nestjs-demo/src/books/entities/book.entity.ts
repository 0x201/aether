import { Author } from 'src/authors/entities/author.entity';
import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('books')
export class Book extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  title: string;

  @Column('decimal', { precision: 18, scale: 2 })
  price: number;

  @Column()
  isbn: string;

  @Column({ length: 2048 })
  description: string;

  @Column()
  publishDate: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Author, (author) => author.books, { cascade: true })
  author: Author;
}
