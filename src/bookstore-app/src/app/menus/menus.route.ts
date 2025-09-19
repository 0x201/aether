import { Route } from "@angular/router";
import { authGuard } from "../services/auth/auth.guard";

export const MenusRoutes: Route[] = [
     {
    path: 'menus/management',
    loadComponent: () => import('./menu-management/menu-management').then(mod => mod.MenuManagementComponent),
    canActivate: [authGuard],
    data: { roles: ['admin'] }
  },

];