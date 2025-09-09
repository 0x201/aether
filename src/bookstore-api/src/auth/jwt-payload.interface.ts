export interface JwtPayload {
  sub: string;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
  menus: {
    id: number;
    name: string;
    title: string;
    icon: string;
    route: string;
    order: number;
    parentId: number;
    roles: string[];
  }[];
}