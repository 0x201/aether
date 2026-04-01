import { BookAuthor } from '../../books/entities/book-author.entity'
import { BaseAuditableEntity } from '../../common/BaseAuditableEntity.entity'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('authors', { schema: 'bookstore' })
export class Author extends BaseAuditableEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'authors_pk' })
  id: number

  @Column({ name: 'first_name', length: 50 })
  firstName: string

  @Column({ name: 'last_name', length: 50 })
  lastName: string

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @OneToMany(() => BookAuthor, (bookAuthor) => bookAuthor.author)
  bookAuthors: BookAuthor[]
}
