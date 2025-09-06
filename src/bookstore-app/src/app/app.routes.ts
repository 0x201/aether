import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(mod => mod.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup').then(mod => mod.SignupComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(mod => mod.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'books',
    loadComponent: () => import('./books/book-list/book-list').then(mod => mod.BookListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./books/book-detail/book-detail').then(mod => mod.BookDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    children: [
      {
        path: 'books',
        loadComponent: () => import('./admin/book-management/book-management').then(mod => mod.BookManagementComponent),
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];