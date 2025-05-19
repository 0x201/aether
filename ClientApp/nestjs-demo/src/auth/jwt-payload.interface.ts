export interface JwtPayload {
  sub: string;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}
