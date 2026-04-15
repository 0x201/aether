import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, retry, tap, throwError } from 'rxjs';
import { CreateOrUpdateMenuCommand, Menu } from '../models/menu.model';
import { PagedResult } from '../models/paged-result.model';
import { ApiState } from '../models/api-state';

@Injectable({
  providedIn: 'root'
})
export class MenusService {
  private baseUrl = '/api/menus';

  private menusState: WritableSignal<ApiState<Menu[]>> = signal<ApiState<Menu[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0
  });

  public menusState$ = this.menusState.asReadonly();

  private menuDetailState: WritableSignal<ApiState<Menu>> = signal<ApiState<Menu>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0
  });

  private http: HttpClient = inject(HttpClient);

  public menuDetailState$ = this.menuDetailState.asReadonly();

  constructor() { }

  getMenus(page: number = 0, pageSize: number = 10): Observable<PagedResult<Menu>> {
    this.updateMenusState({ loading: true, error: null });
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

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
        tap(menu => {
          this.updateMenuDetailState({
            data: menu,
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

  private getErrorMessage(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message;
    }
    return error.error?.message || error.message || 'Unknown error occurred';
  }

  private updateMenusState(newState: Partial<ApiState<Menu[]>>): void {
    this.menusState.update(current => ({
      ...current,
      ...newState
    }));
  }

  private updateMenuDetailState(newState: Partial<ApiState<Menu>>): void {
    this.menuDetailState.update(current => ({
      ...current,
      ...newState
    }));
  }

  private refreshMenus(): void {
    // 重新获取菜单列表的逻辑
  }
}