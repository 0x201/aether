import { Entity, Index, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Book } from "./book.entity";
import { Author } from "src/authors/entities/author.entity";



@Entity('book_author')
@Index('IDX_BOOK_AUTHOR_AUTHOR_ID', ['authorId'])
@Index('IDX_BOOK_AUTHOR_BOOK_ID', ['bookId'])
export class BookAuthor {
    @PrimaryColumn({ name: 'book_id' })
    bookId: number;

    @PrimaryColumn({ name: 'author_id' })
    authorId: number;

    @ManyToOne(() => Book, (book) => book.bookAuthors, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'book_id', foreignKeyConstraintName: 'FK_BOOK_AUTHOR_BOOK_ID' })
    book: Book;

    @ManyToOne(() => Author, (author) => author.bookAuthors, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'author_id', foreignKeyConstraintName: 'FK_BOOK_AUTHOR_AUTHOR_ID' })
    author: Author;
}
