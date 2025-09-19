import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, retry, tap, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { PagedResult } from '../models/paged-result.model';
import { ApiState } from '../models/api-state';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private baseUrl = '/api/users';

  private usersState = new BehaviorSubject<ApiState<User[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0
  });

  public usersState$ = this.usersState.asObservable();

  private userDetailState = new BehaviorSubject<ApiState<User>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0
  });

  public userDetailState$ = this.userDetailState.asObservable();

  private http: HttpClient = inject(HttpClient);

  constructor() { }

  getUsers(page: number = 0, pageSize: number = 10): Observable<PagedResult<User>> {
    this.updateUsersState({ loading: true, error: null });
    const params = {
      skipCount: (page * pageSize),
      maxResultCount: pageSize
    };

    return this.http.get<PagedResult<User>>(this.baseUrl, { params })
      .pipe(
        tap(res => {
          this.updateUsersState({
            data: res.items,
            loading: false,
            timestamp: Date.now()
          });
        }),
        catchError(error => {
          const errMsg = this.getErrorMessage(error);
          this.updateUsersState({
            loading: false,
            error: this.getErrorMessage(error)
          });
          return throwError(() => new Error(errMsg));
        }),
        retry(2)
      );
  }

  getUser(id: number): Observable<User> {
    this.updateUserDetailState({ loading: true, error: null });
    return this.http.get<User>(`${this.baseUrl}/${id}`).pipe(
      tap(user => {
        this.updateUserDetailState({
          data: user,
          loading: false,
          timestamp: Date.now()
        });
      }),
      catchError(error => {
        const errMsg = this.getErrorMessage(error);
        this.updateUserDetailState({
          loading: false,
          error: this.getErrorMessage(error)
        });
        return throwError(() => new Error(errMsg));
      }),
      retry(2)
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user)
      .pipe(
        tap(() => {
          this.refreshUsers();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user)
      .pipe(
        tap(() => {
          this.refreshUsers();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => {
          this.refreshUsers();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  refreshUsers(): void {
    if (!this.usersState.value.loading) {
      this.getUsers().subscribe();
    }
  }

  private updateUsersState(updates: Partial<ApiState<User[]>>) {
    this.usersState.next({
      ...this.usersState.value,
      ...updates
    });
  }

  private updateUserDetailState(updates: Partial<ApiState<User>>) {
    this.userDetailState.next({
      ...this.userDetailState.value,
      ...updates
    });
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