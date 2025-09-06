import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth/auth.interceptor';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { provideNativeDateAdapter } from '@angular/material/core';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

export function jwtOptionsFactory() {
  return {
    tokenGetter: tokenGetter,
    allowedDomains: ['localhost:3000'],
    disallowedRoutes: ['localhost:3000/api/auth/signin', 'localhost:3000/api/auth/signup'],
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory },
    JwtHelperService,
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
  ],
};