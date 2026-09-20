import { Route } from '@angular/router'

import { canActivateAuthRole } from '../services/auth/auth.guard'

export const UsersRoutes: Route[] = [
  {
    path: 'users/profile',
    loadComponent: () =>
      import('./user-profile/user-profile').then((mod) => mod.UserProfileComponent),
    canActivate: [canActivateAuthRole],
  },
  {
    path: 'users/management',
    loadComponent: () =>
      import('./user-management/user-management').then((mod) => mod.UserManagementComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: ['admin'] },
  },
]
