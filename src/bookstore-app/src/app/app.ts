import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Menu } from './models/menu.model';
import { MatTreeModule } from '@angular/material/tree';
import { FormsModule } from '@angular/forms';
import { Role } from './models/role.model';
import { RecursiveMenu } from './menus/menu-item/recursive-menu';
import { ScrollingModule } from "@angular/cdk/scrolling";
import { UsersService } from './services/users.service';
import keycloak from 'keycloak-js';

interface MenuNode {
  id: number;
  name: string;
  title: string;
  icon: string;
  route: string;
  order: number;
  roles: Role[];
  children?: MenuNode[];
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
]
})
export class App implements OnInit, AfterViewInit, OnDestroy {  
  private destroy$ = new Subject<void>();
  isHandset$!: Observable<boolean>;
  menus: Menu[] = [];
  isSidenavOpened = false;
  
  childrenMenuAccessor = (node: MenuNode) => node.children ?? [];

  hasChild = (_: number, node: MenuNode) => !!node.children && node.children.length > 0
  
  menuTreeData: MenuNode[] = [];

  private keycloakService = inject(keycloak);
  private userService = inject(UsersService);

  constructor(
    private breakpointObserver: BreakpointObserver,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
      
    this.loadMenusFromToken();
  }
  
  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.keycloakService.logout();
  }
  
  
  private loadMenusFromToken(): void {
    this.userService.loadUserMenus().subscribe(menus => {
      this.menus = menus;
      const userRoles = this.userService.getCurrentUserRoles();
      // Convert roles to Role[] format
      const roles: Role[] = userRoles.map(roleName => ({ id: 0, name: roleName } as Role));
      this.menuTreeData = this.buildTreeMenuData(this.menus, roles);
      this.cdRef.detectChanges();
    });
  }
  
  private buildTreeMenuData(menus: Menu[], roles: Role[]): MenuNode[] {
    const menuMap = new Map<number, MenuNode>();
    menus.forEach(menu => {
      menuMap.set(menu.id, { 
        id: menu.id,
        name: menu.name,
        title: menu.title,
        icon: menu.icon,
        route: menu.route,
        order: menu.order,
        roles: menu.roles,
        children: []
      });
    });

    const tree: MenuNode[] = [];

    menus.forEach(menu => {
      const menuNode = menuMap.get(menu.id)!;
      if (menu.parentId === 0) {
        // Root level menu
        tree.push(menuNode);
      } else {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menuNode);
        }
      }
    });

    const sortMenus = (menuNodes: MenuNode[]) => {
      menuNodes.sort((a, b) => a.order - b.order);
      menuNodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortMenus(node.children);
        }
      });
    };

    sortMenus(tree);
    return tree;
  }
  
  menuRoleNames(menu: MenuNode): string[] {
    if (!menu.roles) return [];
    return menu.roles.map(r => r.name);
  }
}