export class KeycloakConfig {
  realm: string;
  'auth-server-url': string;
  resource: string;
  clientId: string;
  clientSecret: string;
  'ssl-required': string;
  'confidential-port': number;
}