import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService, JwtPayload } from './services/auth/auth.service';
import { RoleDirective } from './services/auth/role.directive';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Menu } from './models/menu.model';

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
    AsyncPipe,
    RouterOutlet,
    RoleDirective,
  ]
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  private destroy$ = new Subject<void>();
  isHandset$!: Observable<boolean>;
  menus: Menu[] = [];
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router,
    private jwtHelper: JwtHelperService,
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
    this.authService.logout();
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }
  
  private loadMenusFromToken(): void {
    const token = this.authService.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decoded: JwtPayload | null = this.jwtHelper.decodeToken(token);
      if (decoded && decoded.menus) {
        this.menus = decoded.menus;
        this.cdRef.detectChanges();
      }
    }
  }
}