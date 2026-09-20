import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable, signal, WritableSignal } from '@angular/core'
import { catchError, Observable, retry, tap, throwError } from 'rxjs'

import { ApiState } from '../models/api-state'
import { PagedQuery, PagedResult } from '../models/paged-result.model'
import { Role } from '../models/role.model'

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private apiUrl = '/api/roles'

  private rolesState: WritableSignal<ApiState<Role[]>> = signal<ApiState<Role[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0,
  })

  public rolesState$ = this.rolesState.asReadonly()

  private roleDetailState: WritableSignal<ApiState<Role>> = signal<ApiState<Role>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0,
  })

  public roleDetailState$ = this.roleDetailState.asReadonly()
  private http: HttpClient = inject(HttpClient)

  constructor() {}

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/all`)
  }

  getRoles(query: PagedQuery): Observable<PagedResult<Role>> {
    this.updateRolesState({ loading: true, error: null })
    let params = new HttpParams()
      .set('page', query.page * query.pageSize)
      .set('pageSize', query.pageSize)
    if (query.filter) {
      params = params.set('filter', query.filter)
    }
    if (query.sorting) {
      params = params.set('sorting', query.sorting)
    }
    return this.http.get<PagedResult<Role>>(this.apiUrl, { params }).pipe(
      tap((res) => {
        this.updateRolesState({
          data: res.data,
          loading: false,
          timestamp: Date.now(),
        })
      }),
      catchError((error) => {
        const errMsg = this.getErrorMessage(error)
        this.updateRolesState({
          loading: false,
          error: this.getErrorMessage(error),
        })
        return throwError(() => new Error(errMsg))
      }),
      retry(2),
    )
  }

  getRoleById(id: number): Observable<Role> {
    this.updateRoleDetailState({ loading: true, error: null })
    return this.http.get<Role>(`${this.apiUrl}/${id}`).pipe(
      tap((user) => {
        this.updateRoleDetailState({
          data: user,
          loading: false,
          timestamp: Date.now(),
        })
      }),
      catchError((error) => {
        const errMsg = this.getErrorMessage(error)
        this.updateRoleDetailState({
          loading: false,
          error: this.getErrorMessage(error),
        })
        return throwError(() => new Error(errMsg))
      }),
      retry(2),
    )
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role).pipe(
      tap(() => {
        this.refreshRoles()
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    )
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, role).pipe(
      tap(() => {
        this.refreshRoles()
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    )
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.refreshRoles()
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    )
  }

  private getErrorMessage(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message
    }
    return error.error?.message || error.message || 'Unknown error occurred'
  }

  private updateRolesState(newState: Partial<ApiState<Role[]>>): void {
    this.rolesState.update((current) => ({
      ...current,
      ...newState,
    }))
  }

  private updateRoleDetailState(newState: Partial<ApiState<Role>>): void {
    this.roleDetailState.update((current) => ({
      ...current,
      ...newState,
    }))
  }

  private refreshRoles(): void {
    // 重新获取角色列表的逻辑
  }
}
