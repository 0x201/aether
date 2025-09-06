import { Route } from "@angular/router";

export const AuthRoutes: Route[] = [
    {
        path: 'login',
        loadComponent: () => import('./login/login').then(mod => mod.LoginComponent)
    },
    {
        path: 'signup',
        loadComponent: () => import('./signup/signup').then(mod => mod.SignupComponent)
    },
];