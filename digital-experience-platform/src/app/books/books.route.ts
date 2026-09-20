import { Routes } from '@angular/router'

import { canActivateAuthRole } from '../services/auth/auth.guard'

export const BooksRoutes: Routes = [
  {
    path: 'books',
    loadComponent: () => import('./book-list/book-list').then((mod) => mod.BookList),
    canActivate: [canActivateAuthRole],
  },
  {
    path: 'books/management',
    loadComponent: () =>
      import('./book-management/book-management').then((mod) => mod.BookManagement),
    canActivate: [canActivateAuthRole],
    data: { roles: ['admin'] },
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./book-detail/book-detail').then((mod) => mod.BookDetail),
    canActivate: [canActivateAuthRole],
  },
]
