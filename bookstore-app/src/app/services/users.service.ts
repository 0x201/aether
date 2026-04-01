import { inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import Keycloak from "keycloak-js";
import { JwtHelperService } from "@auth0/angular-jwt";
import { MenusService } from "./menus.service";
import { catchError, Observable, retry, tap, throwError } from "rxjs";
import { Menu } from "../models/menu.model";
import { ApiState } from "../models/api-state";
import { User } from "../models/user.model";
import { PagedResult } from "../models/paged-result.model";
import { HttpClient } from "@angular/common/http";

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
    };
  };
}

@Injectable({
  providedIn: "root",
})
export class UsersService {
  private baseUrl = "/api/users";
  private http: HttpClient = inject(HttpClient);
  private keycloakService = inject(Keycloak);
  private jwtHelper = inject(JwtHelperService);
  private menusService = inject(MenusService);

  private currentUserSignal = signal<any>(null);
  public currentUser$ = this.currentUserSignal.asReadonly();

  private userMenusSignal = signal<Menu[]>([]);
  public userMenus$ = this.userMenusSignal.asReadonly();

  private usersState: WritableSignal<ApiState<User[]>> = signal<ApiState<User[]>>({
    data: [],
    loading: false,
    error: null,
    timestamp: 0,
  });

  public usersState$ = this.usersState.asReadonly();

  private userDetailState: WritableSignal<ApiState<User>> = signal<ApiState<User>>({
    data: null,
    loading: false,
    error: null,
    timestamp: 0,
  });

  public userDetailState$ = this.userDetailState.asReadonly();

  constructor() {}

  parseAccessToken(): JwtPayload | null {
    const token = this.keycloakService.token;
    console.log("Token:", token);
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return this.jwtHelper.decodeToken(token);
    }
    return null;
  }

  getCurrentUserId(): string | null {
    const token = this.parseAccessToken();
    return token ? token.sub || null : null;
  }

  getCurrentUsername(): string | null {
    const token = this.parseAccessToken();
    return token ? token.preferred_username || null : null;
  }

  loadUserMenus(): Signal<Menu[]> {
    const userId = this.getCurrentUserId() || this.getCurrentUsername();
    if (userId) {
      this.menusService.getUserMenus().subscribe({
        next: (result) => {
          this.userMenusSignal.set(result);
        },
        error: (error) => {
          console.error("Error loading user menus:", error);
          this.userMenusSignal.set([]);
        },
      });
    }

    return this.userMenusSignal.asReadonly();
  }

  filterMenusByRoles(menus: Menu[], userRoles: string[]): Menu[] {
    if (!userRoles || userRoles.length === 0) {
      return menus.filter((menu) => menu.roles && menu.roles.length === 0);
    }

    const hasRole = (menu: Menu): boolean => {
      if (!menu.roles || menu.roles.length === 0) return true;
      return menu.roles.some((role) => userRoles.includes(role.name));
    };

    const filterMenuItems = (menuItems: Menu[]): Menu[] => {
      return menuItems
        .filter((item) => item.isActive && hasRole(item))
        .map((item) => ({
          ...item,
          children: item.children ? filterMenuItems(item.children) : [],
        }));
    };

    return filterMenuItems(menus);
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
      page: page,
      pageSize: pageSize,
    };

    return this.http.get<PagedResult<User>>(this.baseUrl, { params }).pipe(
      tap((res) => {
        this.updateUsersState({
          data: res.data,
          loading: false,
          timestamp: Date.now(),
        });
      }),
      catchError((error) => {
        const errMsg = this.getErrorMessage(error);
        this.updateUsersState({ loading: false, error: errMsg });
        return throwError(() => new Error(errMsg));
      }),
      retry(2),
    );
  }

  getUser(id: number): Observable<User> {
    this.updateUserDetailState({ loading: true, error: null });

    return this.http.get<User>(`${this.baseUrl}/${id}`).pipe(
      tap((user) => {
        this.updateUserDetailState({
          data: user,
          loading: false,
          timestamp: Date.now(),
        });
      }),
      catchError((error) => {
        const errMsg = this.getErrorMessage(error);
        this.updateUserDetailState({ loading: false, error: errMsg });
        return throwError(() => new Error(errMsg));
      }),
      retry(2),
    );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.baseUrl, user).pipe(
      tap(() => {
        this.refreshUsers();
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    );
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user).pipe(
      tap(() => {
        this.refreshUsers();
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.refreshUsers();
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    );
  }

  updateUserStatus(id: number, isActive: boolean): Observable<User> {
    const body = { isActive };
    return this.http.patch<User>(`${this.baseUrl}/${id}/status`, body).pipe(
      tap(() => {
        this.refreshUsers();
      }),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error)))),
    );
  }

  private updateUsersState(newState: Partial<ApiState<User[]>>): void {
    this.usersState.update((current) => ({
      ...current,
      ...newState,
    }));
  }

  private updateUserDetailState(newState: Partial<ApiState<User>>): void {
    this.userDetailState.update((current) => ({
      ...current,
      ...newState,
    }));
  }

  private refreshUsers(): void {
    // 重新获取用户列表的逻辑
  }

  private getErrorMessage(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message;
    }
    return error.error?.message || error.message || "Unknown error occurred";
  }
}
