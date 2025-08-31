export interface Book {
  id: number;
  isbn: string;
  title: string;
  price: number;
  description: string;
  publishDate: string;
  isActive: boolean;
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