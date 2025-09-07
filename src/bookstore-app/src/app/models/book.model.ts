export interface Book {
  id: number;
  isbn: string;
  title: string;
  price: number;
  description: string;
  publishDate: string;
  isActive: boolean;
  bookAuthors: BookAuthor[];
}

export interface BookAuthor {
  bookId: number;
  authorId: number;
  author: Author;
}

export interface Author {
  id: number;
  firstName: string;
  lastName: string;
}

export interface BookDto {
  title: string;
  isbn: string;
  description: string;
  publishDate: string;
  price: number;
  authorIds: number[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}