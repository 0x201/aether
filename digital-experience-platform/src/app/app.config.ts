import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core'
import { provideNativeDateAdapter } from '@angular/material/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt'
import {
  AutoRefreshTokenService,
  provideKeycloak,
  UserActivityService,
  withAutoRefreshToken,
  createInterceptorCondition,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
} from 'keycloak-angular'

import { routes } from './app.routes'
import { ConfigService } from './services/config.service'

export function tokenGetter() {
  return localStorage.getItem('access_token')
}

export function jwtOptionsFactory(configService: ConfigService) {
  const apiEndpoint = configService.getApiEndpoint()

  return {
    tokenGetter: tokenGetter,
    allowedDomains: [...apiEndpoint],
    disallowedRoutes: [],
  }
}

function getUrlCondition(configService: ConfigService): IncludeBearerTokenCondition {
  const apiEndpoint = configService.getApiEndpoint()
  console.log('apiEndpoint', apiEndpoint)
  return createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: /^(apiEndpoint)(\/.*)?$/i,
    bearerPrefix: 'Bearer',
  })
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloak({
      config: {
        url: 'http://localhost:8080',
        realm: 'aether',
        clientId: 'bookstoreapp',
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      },
      features: [
        withAutoRefreshToken({
          onInactivityTimeout: 'logout',
          sessionTimeout: 60000,
        }),
      ],
      providers: [AutoRefreshTokenService, UserActivityService],
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [getUrlCondition],
      deps: [ConfigService],
    },
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: JWT_OPTIONS,
      useFactory: jwtOptionsFactory,
      deps: [ConfigService],
    },
    JwtHelperService,
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    provideNativeDateAdapter(),
    ConfigService,
  ],
}
