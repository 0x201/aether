import { Route } from '@angular/router'

import { canActivateAuthRole } from '../services/auth/auth.guard'

export const MenusRoutes: Route[] = [
  {
    path: 'menus/management',
    loadComponent: () =>
      import('./menu-management/menu-management').then((mod) => mod.MenuManagementComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: ['admin'] },
  },
]
