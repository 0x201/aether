import { BookAuthor } from 'src/books/entities/book-author.entity';
import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('authors')
export class Author extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50})
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => BookAuthor, (ba) => ba.author)
  bookAuthors: BookAuthor[];
}
