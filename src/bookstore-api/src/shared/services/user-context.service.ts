import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

export interface UserPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
}

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getCurrentUser(): UserPayload | null {
    return (this.request as any).user;
  }

  getUsername(): string | undefined {
    return (this.request as any).user?.username;
  }

  getRoles(): string[] {
    return (this.request as any).user?.roles || [];
  }
}