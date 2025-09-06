import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[appRole],[appRoleAny],[appRoleExcept]',
  standalone: true
})
export class RoleDirective {
  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set appRole(roles: string[]) {
    this.updateView(roles, 'all');
  }

  @Input() set appRoleAny(roles: string[]) {
    this.updateView(roles, 'any');
  }

  @Input() set appRoleExcept(roles: string[]) {
    this.updateView(roles, 'except');
  }

  private updateView(roles: string[], strategy: 'all' | 'any' | 'except'): void {
    let hasRole = false;

    switch (strategy) {
      case 'all':
        hasRole = roles.every(role => this.authService.hasRole(role));
        break;
      case 'any':
        hasRole = this.authService.hasAnyRole(roles);
        break;
      case 'except':
        hasRole = !this.authService.hasAnyRole(roles);
        break;
    }

    if (hasRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}