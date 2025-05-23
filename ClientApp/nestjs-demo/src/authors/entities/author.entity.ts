import { Book } from 'src/books/entities/book.entity';
import { BaseAuditableEntity } from 'src/common/BaseAuditableEntity.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('authors')
export class Author extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Book, (b) => b.author)
  books: Book[];
}
