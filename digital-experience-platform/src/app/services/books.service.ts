import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, retry, tap, throwError } from 'rxjs';
import { Book } from '../models/book.model';
import { ApiState } from '../models/api-state'
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private baseUrl = '/api/books';

  private booksState: WritableSignal<ApiState<Book[]>> = signal<ApiState<Book[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0
  });

  public booksState$ = this.booksState.asReadonly();

  private bookDetailState: WritableSignal<ApiState<Book>> = signal<ApiState<Book>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0
  });

  public bookDetailState$ = this.bookDetailState.asReadonly();

  private http: HttpClient = inject(HttpClient);

  constructor() { }

  getBooks(page: number = 0, pageSize: number = 10): Observable<PagedResult<Book>> {
    this.updateBooksState({ loading: true, error: null });

    const params = {
      page: page,
      pageSize: pageSize
    };

    return this.http.get<PagedResult<Book>>(this.baseUrl, { params })
      .pipe(
        tap(res => {
          this.updateBooksState({
            data: res.data,
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
    this.updateBookDetailState({ loading: true, error: null });

    return this.http.get<Book>(`${this.baseUrl}/${id}`)
      .pipe(
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

  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, book)
      .pipe(
        tap(() => {
          this.refreshBooks();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, book)
      .pipe(
        tap(() => {
          this.refreshBooks();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => {
          this.refreshBooks();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  private getErrorMessage(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message;
    }
    return error.error?.message || error.message || 'Unknown error occurred';
  }

  private updateBooksState(newState: Partial<ApiState<Book[]>>): void {
    this.booksState.update(current => ({
      ...current,
      ...newState
    }));
  }

  private updateBookDetailState(newState: Partial<ApiState<Book>>): void {
    this.bookDetailState.update(current => ({
      ...current,
      ...newState
    }));
  }

  public refreshBooks(): void {
    // 重新获取书籍列表的逻辑，可以根据实际需求实现
    // 例如：调用 getBooks 方法或设置状态为需要刷新
  }
}