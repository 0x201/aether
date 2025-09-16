import { BookAuthor } from '../../books/entities/book-author.entity';
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Authors')
export class Author extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'FirstName', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'LastName', type: 'varchar', length: 50 })
  lastName: string;

  @Column({ name: 'IsActive', default: true })
  isActive: boolean;

  @OneToMany(() => BookAuthor, (bookAuthor) => bookAuthor.author)
  bookAuthors: BookAuthor[];
}
