import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';
import { BooksRoutes } from './books/books.route';
import { UsersRoutes } from './users/users.route';
import { AuthRoutes } from './auth/auth.route';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  ...AuthRoutes,
  ...BooksRoutes,
  ...UsersRoutes,
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(mod => mod.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];