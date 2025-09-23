import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ConfigService } from './services/config.service';
import {
  AutoRefreshTokenService,
  provideKeycloak,
  UserActivityService,
  withAutoRefreshToken,
  createInterceptorCondition,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG
} from 'keycloak-angular';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';


export function tokenGetter() {
  return localStorage.getItem('access_token');
}

export function jwtOptionsFactory(configService: ConfigService) {
  const apiEndpoint = configService.getApiEndpoint();

  return {
    tokenGetter: tokenGetter,
    allowedDomains: [...apiEndpoint],
    disallowedRoutes: [],
  };
}

const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http:\/\/localhost:3011)(\/.*)?$/i,
  bearerPrefix: 'Bearer',
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloak({
      config: {
        url: 'http://localhost:8080',
        realm: 'moderncsharp',
        clientId: 'bookstore-app',
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      },
      features: [
        withAutoRefreshToken({
          onInactivityTimeout: 'logout',
          sessionTimeout: 60000
        })
      ],
      providers: [AutoRefreshTokenService, UserActivityService]
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [urlCondition]
    },
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
     { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory, deps: [ConfigService] },
    JwtHelperService,
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    provideNativeDateAdapter(),
    ConfigService
  ],
};