import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

export interface UserPayload {
  sub: string;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}

@Injectable({ scope: Scope.REQUEST })
export class CurrentUser {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getUser(): UserPayload | null {
    return (this.request as any).user;
  }

  getUsername(): string | undefined {
    return (this.request as any).user?.username;
  }

  getRoles(): string[] {
    return (this.request as any).user?.roles || [];
  }

  getPermissions(): string[] {
    return (this.request as any).user?.permissions || [];
  }
}
