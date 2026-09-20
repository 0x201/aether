import { Routes } from '@angular/router'

import { BooksRoutes } from '@/app/books/books.route'
import { MenusRoutes } from '@/app/menus/menus.route'
import { canActivateAuthRole } from '@/app/services/auth/auth.guard'
import { UsersRoutes } from '@/app/users/users.route'

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  ...BooksRoutes,
  ...UsersRoutes,
  ...MenusRoutes,
  {
    path: 'home',
    loadComponent: () => import('./home/home').then((mod) => mod.Home),
    canActivate: [canActivateAuthRole],
  },
]
