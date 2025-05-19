import { Book } from 'src/books/entities/book.entity';
import { IAuditable } from 'src/common/interface/IPagedResult.interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('authors')
export class Author implements IAuditable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdTime' })
  createdTime: string;

  @Column({ default: '' })
  createdBy: string;

  @UpdateDateColumn({ name: 'lastModifiedTime', nullable: true })
  lastModifiedTime: string;

  @Column({ nullable: true })
  lastModifiedBy: string;

  @OneToMany(() => Book, (b) => b.author)
  books: Book[];
}
