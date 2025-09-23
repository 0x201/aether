import { Routes } from '@angular/router';
import { canActivateAuthRole } from './services/auth/auth.guard';
import { BooksRoutes } from './books/books.route';
import { UsersRoutes } from './users/users.route';
import { MenusRoutes } from './menus/menus.route';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  ...BooksRoutes,
  ...UsersRoutes,
  ...MenusRoutes,
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(mod => mod.HomeComponent),
    canActivate: [canActivateAuthRole]
  },
];