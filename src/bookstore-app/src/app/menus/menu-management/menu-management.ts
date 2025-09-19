import { Component, OnInit, ViewChild, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CreateOrUpdateMenuCommand, Menu } from '../../models/menu.model';
import { MenusService } from '../../services/menus.service';
import { RolesService } from '../../services/roles.service';
import { Role } from '../../models/role.model';
import { MenuDialogComponent } from './menu-dialog';
import { Subject, takeUntil } from 'rxjs';

// Import Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-menu-management',
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuManagementComponent implements OnInit {
  private destroy$ = new Subject<void>();
  
  menus: MatTableDataSource<Menu> = new MatTableDataSource<Menu>([]);
  roles: Role[] = [];
  displayedColumns: string[] = ['name', 'title', 'icon', 'route', 'order', 'roles', 'isActive', 'actions'];
  
  pageSize = 10;
  currentPage = 0;
  totalMenus = 0;
  snackBarConfig: MatSnackBarConfig = { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  menusService = inject(MenusService);
  rolesService = inject(RolesService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadMenus();
    this.loadRoles();
  }

  loadMenus(): void {
     this.menusService.menusState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state?.data) {
          this.menus.data = state.data;
          if (this.paginator) {
            this.paginator.length = this.totalMenus;
          }
        }
      });

    this.menusService
      .getMenus(this.currentPage, this.pageSize)
      .subscribe({
        next: (result) => {
          this.totalMenus = result.totalCount;
          if (this.paginator) {
            this.paginator.length = this.totalMenus;
          }
        },
        error: (error) => {
          console.error('Error loading menus:', error);
          this.snackBar.open('Error loading menus', 'Close', this.snackBarConfig);
        }
      });
  }

  loadRoles(): void {
    this.rolesService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        this.snackBar.open('Error loading roles', 'Close', this.snackBarConfig);
        console.error('Error loading roles:', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMenus();
  }

  openAddMenuDialog(): void {
    if (this.roles.length === 0) {
      this.loadRoles();
    }
    
    const dialogRef = this.dialog.open(MenuDialogComponent, {
      width: '500px',
      data: { menu: null, roles: this.roles }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.createMenu(result);
      }
    });
  }

  openEditMenuDialog(menu: Menu): void {
    if (this.roles.length === 0) {
      this.loadRoles();
    }
    
    const dialogRef = this.dialog.open(MenuDialogComponent, {
      width: '500px',
      data: { menu: { ...menu }, roles: this.roles }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.updateMenu(menu.id, result);
      }
    });
  }

  createMenu(menu: CreateOrUpdateMenuCommand): void {
    this.menusService.createMenu(menu).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Menu created successfully', 'Close', this.snackBarConfig);
        this.loadMenus();
      },
      error: (error) => {
        this.snackBar.open('Error creating menu', 'Close', this.snackBarConfig);
        console.error('Error creating menu:', error);
      }
    });
  }

  toggleMenu(id: number, isActive: boolean) {
    this.menusService.updateMenu(id, {isActive: isActive }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedMenu) => {
        this.snackBar.open('Menu updated successfully', 'Close', this.snackBarConfig);
        this.loadMenus();
      },
      error: (error) => {
        this.snackBar.open('Error updating menu', 'Close', this.snackBarConfig);
        console.error('Error updating menu:', error);
      }
    });
  }

  updateMenu(id: number, menu: CreateOrUpdateMenuCommand): void {
    this.menusService.updateMenu(id, menu).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Menu updated successfully', 'Close', this.snackBarConfig);
        this.loadMenus();
      },
      error: (error) => {
        this.snackBar.open('Error updating menu', 'Close', this.snackBarConfig);
        console.error('Error updating menu:', error);
      }
    });
  }

  deleteMenu(menu: Menu): void {
    if (confirm(`Are you sure you want to delete menu ${menu.name}?`)) {
      this.menusService.deleteMenu(menu.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.snackBar.open('Menu deleted successfully', 'Close', this.snackBarConfig);
          this.loadMenus();
        },
        error: (error) => {
          this.snackBar.open('Error deleting menu', 'Close', this.snackBarConfig);
          console.error('Error deleting menu:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}