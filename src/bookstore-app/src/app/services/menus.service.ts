import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, retry, tap, throwError } from 'rxjs';
import { CreateOrUpdateMenuCommand, Menu } from '../models/menu.model';
import { PagedResult } from '../models/paged-result.model';
import { ApiState } from '../models/api-state';

@Injectable({
  providedIn: 'root'
})
export class MenusService {
  private baseUrl = '/api/menus';

  private menusState = new BehaviorSubject<ApiState<Menu[]>>(
    {
      data: null,
      loading: false,
      error: null,
      timestamp: Date.now()
    }
  );

  public menusState$ = this.menusState.asObservable();

  private menuDetailState = new BehaviorSubject<ApiState<Menu>>(
    {
      data: null,
      loading: false,
      error: null,
      timestamp: Date.now()
    }
  );

  private http: HttpClient = inject(HttpClient);

  public menuDetailState$ = this.menuDetailState.asObservable();

  constructor() { }

  getMenus(page: number = 0, pageSize: number = 10): Observable<PagedResult<Menu>> {
    this.updateMenusState({ loading: true, error: null });
    const params = {
      page: page,
      pageSize: pageSize
    };

    return this.http.get<PagedResult<Menu>>(this.baseUrl, { params })
      .pipe(
        tap(res => {
          this.updateMenusState({
            data: res.data,
            loading: false,
            timestamp: Date.now()
          });
        }),
        catchError(error => {
          const errMsg = this.getErrorMessage(error);
          this.updateMenusState({ loading: false, error: errMsg });
          return throwError(() => new Error(errMsg));
        }),
        retry(2)
      );
  }

  getMenu(id: number): Observable<Menu> {
    this.updateMenuDetailState({ loading: true, error: null });
    return this.http.get<Menu>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(book => {
          this.updateMenuDetailState({
            data: book,
            loading: false,
            timestamp: Date.now()
          });
        }),
        catchError(error => {
          const errMsg = this.getErrorMessage(error);
          this.updateMenuDetailState({ loading: false, error: errMsg });
          return throwError(() => new Error(errMsg));
        }),
        retry(2)
      );
  }

  createMenu(menu: CreateOrUpdateMenuCommand): Observable<Menu> {
    return this.http.post<Menu>(this.baseUrl, menu)
      .pipe(
        tap(() => {
          this.refreshMenus();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  getUserMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.baseUrl}/user`);
  }

  updateMenu(id: number, menu: Partial<Menu>): Observable<Menu> {
    return this.http.put<Menu>(`${this.baseUrl}/${id}`, menu)
      .pipe(
        tap(() => {
          this.refreshMenus();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  deleteMenu(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => {
          this.refreshMenus();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  refreshMenus(): void {
    if (!this.menusState.value.loading) {
      this.getMenus().subscribe();
    }
  }

  private updateMenusState(updates: Partial<ApiState<Menu[]>>) {
    this.menusState.next({ ...this.menusState.value, ...updates });
  }

  private updateMenuDetailState(updates: Partial<ApiState<Menu>>) {
    this.menuDetailState.next({ ...this.menuDetailState.value, ...updates });
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