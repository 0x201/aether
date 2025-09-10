import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appRole],[appRoleAny],[appRoleExcept]',
  standalone: true
})
export class RoleDirective implements OnInit, OnDestroy {
  private isVisible = false;
  private roles: string[] = [];
  private strategy: 'all' | 'any' | 'except' = 'all';
  private userRolesSubscription: Subscription | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  @Input() set appRole(roles: string[]) {
    console.log('RoleDirective appRole input set:', roles);
    this.roles = roles;
    this.strategy = 'all';
    this.updateView();
  }

  @Input() set appRoleAny(roles: string[]) {
    this.roles = roles;
    this.strategy = 'any';
    this.updateView();
  }

  @Input() set appRoleExcept(roles: string[]) {
    this.roles = roles;
    this.strategy = 'except';
    this.updateView();
  }

  ngOnInit(): void {
    this.userRolesSubscription = this.authService.getUserRolesObservable().subscribe((roles) => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    if (this.userRolesSubscription) {
      this.userRolesSubscription.unsubscribe();
    }
  }

  private updateView(): void {
    let hasRole = false;

    switch (this.strategy) {
      case 'all':
        hasRole = this.roles.every(role => this.authService.hasRole(role));
        break;
      case 'any':
        hasRole = this.authService.hasAnyRole(this.roles);
        break;
      case 'except':
        hasRole = !this.authService.hasAnyRole(this.roles);
        break;
    }

    if (hasRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    } else if (hasRole && !this.viewContainer.length) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    }
    
    this.changeDetectorRef.markForCheck();
  }
}