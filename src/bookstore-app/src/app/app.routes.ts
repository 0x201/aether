import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';
import { BooksRoutes } from './books/books.route';
import { UsersRoutes } from './users/users.route';
import { AuthRoutes } from './auth/auth.route';
import { MenusRoutes } from './menus/menus.route';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  ...AuthRoutes,
  ...BooksRoutes,
  ...UsersRoutes,
  ...MenusRoutes,
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