import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { ScrollingModule } from '@angular/cdk/scrolling'
import { AsyncPipe, CommonModule } from '@angular/common'
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTreeModule } from '@angular/material/tree'
import { RouterOutlet, RouterModule } from '@angular/router'
import Keycloak from 'keycloak-js'
import { Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'

import { RecursiveMenu } from './menus/menu-item/recursive-menu'
import { Menu } from './models/menu.model'
import { Role } from './models/role.model'
import { UsersService } from './services/users.service'

interface MenuNode {
  id: number
  name: string
  title: string
  icon: string
  route: string
  order: number
  roles: Role[]
  children?: MenuNode[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    AsyncPipe,
    RouterOutlet,
    MatTreeModule,
    FormsModule,
    ScrollingModule,
    RecursiveMenu,
  ],
})
export class App implements OnInit, AfterViewInit {
  isHandset$!: Observable<boolean>
  menus: Menu[] = []
  isSidenavOpened = false

  childrenMenuAccessor = (node: MenuNode) => node.children ?? []

  hasChild = (_: number, node: MenuNode) => !!node.children && node.children.length > 0

  menuTreeData: MenuNode[] = []

  private keycloakService = inject(Keycloak)
  private userService = inject(UsersService)

  constructor(
    private breakpointObserver: BreakpointObserver,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map((result) => result.matches),
      shareReplay(),
    )

    this.loadMenusFromToken()
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges()
  }

  logout(): void {
    this.keycloakService.logout()
  }

  private loadMenusFromToken(): void {
    const menus = this.userService.loadUserMenus()()
    this.menus = menus
    const userRoles = this.extractUserRolesFromToken()
    // Convert roles to Role[] format
    const roles: Role[] = userRoles.map((roleName) => ({ id: 0, name: roleName }) as Role)
    this.menuTreeData = this.buildTreeMenuData(this.menus, roles)
    this.cdRef.detectChanges()
  }

  private extractUserRolesFromToken(): string[] {
    const accessToken = this.keycloakService.tokenParsed
    if (!accessToken) {
      return []
    }

    // Extract roles from resource_access using the azp (authorized party) claim as client ID
    let roles: string[] = []
    const clientId = accessToken.azp

    if (clientId && accessToken.resource_access && accessToken.resource_access[clientId]) {
      roles = accessToken.resource_access[clientId].roles || []
    } else if (accessToken.realm_access) {
      // Fallback to realm_access if resource_access is not available
      roles = accessToken.realm_access.roles || []
    }

    return roles
  }

  private buildTreeMenuData(menus: Menu[], roles: Role[]): MenuNode[] {
    const menuMap = new Map<number, MenuNode>()
    menus.forEach((menu) => {
      menuMap.set(menu.id, {
        id: menu.id,
        name: menu.name,
        title: menu.title,
        icon: menu.icon,
        route: menu.route,
        order: menu.order,
        roles: menu.roles,
        children: [],
      })
    })

    const tree: MenuNode[] = []

    menus.forEach((menu) => {
      const menuNode = menuMap.get(menu.id)!
      if (menu.parentId === 0) {
        // Root level menu
        tree.push(menuNode)
      } else {
        const parent = menuMap.get(menu.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(menuNode)
        }
      }
    })

    const sortMenus = (menuNodes: MenuNode[]) => {
      menuNodes.sort((a, b) => a.order - b.order)
      menuNodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortMenus(node.children)
        }
      })
    }

    sortMenus(tree)
    return tree
  }

  menuRoleNames(menu: MenuNode): string[] {
    if (!menu.roles) return []
    return menu.roles.map((r) => r.name)
  }
}
