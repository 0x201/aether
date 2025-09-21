import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth/auth.interceptor';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ConfigService } from './services/config.service';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

export function jwtOptionsFactory(configService: ConfigService) {
  const apiEndpoint = configService.getApiEndpoint();
  console.log("Api Endpoint:", apiEndpoint);

  return {
    tokenGetter: tokenGetter,
    allowedDomains: [...apiEndpoint],
    disallowedRoutes: [`${apiEndpoint}/api/auth/signin`, `${apiEndpoint}/api/auth/signup`],
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory, deps: [ConfigService] },
    JwtHelperService,
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter()
  ],
};