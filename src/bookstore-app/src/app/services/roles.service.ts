import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, retry, tap, throwError } from 'rxjs';
import { Role } from '../models/role.model';
import { PagedQuery, PagedResult } from '../models/paged-result.model';
import { ApiState } from '../models/api-state';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private apiUrl = '/api/roles';

  private rolesState = new BehaviorSubject<ApiState<Role[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0
  });

  public rolesState$ = this.rolesState.asObservable();

  private roleDetailState = new BehaviorSubject<ApiState<Role>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0
  });

  public roleDetailState$ = this.roleDetailState.asObservable();
  private http: HttpClient = inject(HttpClient);

  constructor() { }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/all`);
  }

  getRoles(query: PagedQuery): Observable<PagedResult<Role>> {
    this.updateRolesState({ loading: true, error: null });
    const params = new HttpParams()
      .set('page', query.page * query.pageSize)
      .set('pageSize', query.pageSize);
    if (query.filter) {
      params.set('filter', query.filter);
    }
    if (query.sorting) {
      params.set('sorting', query.sorting);
    }
    return this.http.get<PagedResult<Role>>(this.apiUrl, { params })
      .pipe(
        tap(res => {
          this.updateRolesState({
            data: res.data,
            loading: false,
            timestamp: Date.now()
          });
        }),
        catchError(error => {
          const errMsg = this.getErrorMessage(error);
          this.updateRolesState({
            loading: false,
            error: this.getErrorMessage(error)
          });
          return throwError(() => new Error(errMsg));
        }),
        retry(2)
      );
  }

  getRoleById(id: number): Observable<Role> {
    this.updateRoleDetailState({ loading: true, error: null });
    return this.http.get<Role>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(user => {
          this.updateRoleDetailState({
            data: user,
            loading: false,
            timestamp: Date.now()
          });
        }),
        catchError(error => {
          const errMsg = this.getErrorMessage(error);
          this.updateRoleDetailState({
            loading: false,
            error: this.getErrorMessage(error)
          });
          return throwError(() => new Error(errMsg));
        }),
        retry(2)
      );
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role)
      .pipe(
        tap(() => {
          this.refreshRoles();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, role)
      .pipe(
        tap(() => {
          this.refreshRoles();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.refreshRoles();
        }),
        catchError(error => throwError(() => new Error(this.getErrorMessage(error))))
      );
  }

  refreshRoles(): void {
    if (!this.rolesState.value.loading) {
      const query = {
        page: 0,
        pageSize: 10
      };
      this.getRoles(query).subscribe();
    }
  }

  private updateRolesState(updates: Partial<ApiState<Role[]>>) {
    this.rolesState.next({
      ...this.rolesState.value,
      ...updates
    });
  }

  private updateRoleDetailState(updates: Partial<ApiState<Role>>) {
    this.roleDetailState.next({
      ...this.roleDetailState.value,
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