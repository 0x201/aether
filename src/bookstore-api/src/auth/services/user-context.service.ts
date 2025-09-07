import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  private user: any;

  setUser(user: any) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }
}