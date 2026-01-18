import { inject, Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MenusService } from './menus.service';
import { BehaviorSubject, catchError, Observable, retry, tap, throwError } from 'rxjs';
import { Menu } from '../models/menu.model';
import { ApiState } from '../models/api-state';
import { User } from '../models/user.model';
import { PagedResult } from '../models/paged-result.model';
import { HttpClient } from '@angular/common/http';

interface JwtPayload {
  sub: string;
  preferred_username: string;
  email: string;
  // Keycloak specific claims
  azp: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private baseUrl = '/api/users';
  private http: HttpClient = inject(HttpClient);
  private keycloakService = inject(Keycloak);
  private jwtHelper = inject(JwtHelperService);
  private menusService = inject(MenusService);

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private userMenusSubject = new BehaviorSubject<Menu[]>([]);
  public userMenus$ = this.userMenusSubject.asObservable();

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

  constructor() { }

  parseAccessToken(): JwtPayload | null {
    const token = this.keycloakService.token;
    console.log('Token:', token);
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return this.jwtHelper.decodeToken(token);
    }
    return null;
  }

  getCurrentUserId(): string | null {
    const token = this.parseAccessToken();
    return token ? (token.sub || null) : null;
  }

  getCurrentUsername(): string | null {
    const token = this.parseAccessToken();
    return token ? (token.preferred_username || null) : null;
  }

  loadUserMenus(): Observable<Menu[]> {
    const userId = this.getCurrentUserId() || this.getCurrentUsername();
    console.log('User ID:', userId);
    if (userId) {
      this.menusService.getUserMenus().subscribe({
        next: (result) => {
          this.userMenusSubject.next(result);
        },
        error: (error) => {
          console.error('Error loading user menus:', error);
          this.userMenusSubject.next([]);
        }
      });
    }

    return this.userMenusSubject.asObservable();
  }

  filterMenusByRoles(menus: Menu[], userRoles: string[]): Menu[] {
    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    return menus.filter(menu => {
      if (!menu.roles || menu.roles.length === 0) {
        return true;
      }

      return menu.roles.some(role => userRoles.includes(role.name));
    });
  }

  getCurrentUserRoles(): string[] {
    const token = this.parseAccessToken();
    if (!token) {
      return [];
    }

    // Extract roles from resource_access using the azp (authorized party) claim as client ID
    let roles: string[] = [];
    const clientId = token.azp;

    if (clientId && token.resource_access && token.resource_access[clientId]) {
      roles = token.resource_access[clientId].roles || [];
    } else if (token.realm_access) {
      // Fallback to realm_access if resource_access is not available
      roles = token.realm_access.roles || [];
    }

    return roles;
  }

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