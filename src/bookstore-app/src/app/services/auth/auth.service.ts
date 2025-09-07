import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { RefreshTokenDto } from './refresh-token.dto';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  password: string;
  nickname: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private isAuthenticatedSubject!: BehaviorSubject<boolean>;
  private userRolesSubject!: BehaviorSubject<string[]>;
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private jwtHelper = inject(JwtHelperService);

  constructor() {
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.userRolesSubject = new BehaviorSubject<string[]>(this.getUserRoles());
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/token', credentials)
      .pipe(
        tap(response => {
          if (response.access_token && response.refresh_token) {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access_token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
            this.isAuthenticatedSubject.next(true);
            this.updateUserRoles();
          }
        })
      );
  }

  signUp(userData: SignUpRequest): Observable<any> {
    const signUpData = {
      ...userData,
      roles: ['user'] // assign 'user' role to all users registred from auth api
    };

    return this.http.post('/api/auth/signup', signUpData);
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.isAuthenticatedSubject.next(false);
    this.userRolesSubject.next([]);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (token && this.jwtHelper && !this.jwtHelper.isTokenExpired(token)) {
      const decoded: JwtPayload | null = this.jwtHelper.decodeToken(token);
      if (decoded) {
        return decoded.roles || [];
      }
    }
    return [];
  }

  updateUserRoles(): void {
    this.userRolesSubject.next(this.getUserRoles());
  }

  getUserRolesObservable(): Observable<string[]> {
    return this.userRolesSubject.asObservable();
  }

  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshTokenDto: RefreshTokenDto = { refresh_token: refreshToken };
    
    return this.http.post<LoginResponse>('/api/auth/refresh-token', refreshTokenDto)
      .pipe(
        tap(response => {
          if (response.access_token && response.refresh_token) {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access_token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
            this.isAuthenticatedSubject.next(true);
            this.updateUserRoles();
          }
        }),
        catchError(error => {
          // If refresh token is invalid, logout the user
          this.logout();
          return throwError(() => error);
        })
      );
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
}