import { Author } from "./author.model";

export interface Book {
  id: number;
  isbn: string;
  title: string;
  price: number;
  description: string;
  publishDate: string;
  isActive: boolean;
  authors: Author[];
}