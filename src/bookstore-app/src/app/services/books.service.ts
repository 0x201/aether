import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, retry, tap, throwError } from 'rxjs';
import { PagedResult } from '../models/book.model';
import { Book, BookDto } from '../models/book.model';
import { ApiState } from '../models/api-state'

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private baseUrl = '/api/books';

  private booksState = new BehaviorSubject<ApiState<Book[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0
  });

  public booksState$ = this.booksState.asObservable();

    private bookDetailState = new BehaviorSubject<ApiState<Book>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0
  });

  public bookDetailState$ = this.bookDetailState.asObservable();

  constructor(private http: HttpClient) { }

  getBooks(page: number = 0, pageSize: number = 10): Observable<PagedResult<Book>> {
    this.updateBooksState({ loading: true, error: null });

    const params = {
      skipCount: page * pageSize,
      maxResultCount: pageSize
    };

    return this.http.get<PagedResult<Book>>(this.baseUrl, { params }).pipe(
      tap(books => {
        this.updateBooksState({ 
          data: books.items, 
          loading: false, 
          timestamp: Date.now() 
        });
      }),
      catchError(error => {
        const errMsg = this.getErrorMessage(error);
        this.updateBooksState({ loading: false, error: errMsg });
        return throwError(() => new Error(errMsg));
      }),
      retry(2)
    );
  }

  getBook(id: number): Observable<Book> {
    this.updateBookDetailState({loading: true, error: null});

    return this.http.get<Book>(`${this.baseUrl}/${id}`).pipe(
      tap(book => {
        this.updateBookDetailState({
          data: book,
          loading: false,
          timestamp: Date.now()
        });
      }),
      catchError(error => {
        const errMsg = this.getErrorMessage(error);
        this.updateBookDetailState({ loading: false, error: errMsg });
        return throwError(() => new Error(errMsg));
      }),
      retry(2)
    );
  }

  createBook(book: BookDto): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, book).pipe(
      catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
    );
  }

  updateBook(id: number, book: BookDto): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, book).pipe(
      catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
    );
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
    );
  }

  refreshBooks(): void {
    this.getBooks().subscribe();
  }

  private updateBooksState(updates: Partial<ApiState<Book[]>>) {
    this.booksState.next({ ...this.booksState.value, ...updates });
  }

  private updateBookDetailState(updates: Partial<ApiState<Book>>) {
    this.bookDetailState.next({ ...this.bookDetailState.value, ...updates });
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Network error: Please check your internet connection';
    } else if (error.status === 404) {
      return 'Resource not found';
    } else {
      return error.message || 'An unexpected error occurred';
    }
  }
}