import { Route } from "@angular/router";
import { authGuard } from "../services/auth/auth.guard";

export const UsersRoutes: Route[] = [
    {
        path: 'users/profile',
        loadComponent: () => import('./user-profile/user-profile').then(mod => mod.UserProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: 'users/manage',
        loadComponent: () => import('./user-management/user-management').then(mod => mod.UserManagementComponent),
        canActivate: [authGuard],
        data: { roles: ['admin'] }
    },
];