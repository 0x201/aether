import { Component, OnInit, ViewChild, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { User } from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { Role } from '../../models/role.model';
import { UserDialogComponent } from './user-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { MatCheckbox } from "@angular/material/checkbox";

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatCheckbox
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements OnInit {
  private destory$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  users: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  roles: Role[] = [];
  displayedColumns: string[] = ['username', 'nickname', 'roles', 'isActive', 'actions'];
  pageSize = 10;
  currentPage = 0;
  totalUsers = 0;
  snackBarConfig: MatSnackBarConfig = { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' };
  usersService = inject(UsersService);
  rolesService = inject(RolesService);
  snackBar = inject(MatSnackBar);
  dialog: MatDialog = inject(MatDialog);


  ngOnInit(): void {
    this.loadUsers();
    //this.loadRoles();
  }

  loadUsers(): void {
    this.usersService.usersState$
      .pipe(takeUntil(this.destory$))
      .subscribe(state => {
        if (state?.data) {
          this.users.data = state.data;
          if (this.paginator) {
            this.paginator.length = this.totalUsers;
          }
        }
      });

    this.usersService
      .getUsers(this.currentPage, this.pageSize)
      .subscribe({
        next: (res) => {
          this.users.data = res.items;
          this.totalUsers = res.totalCount;
          if (this.paginator) {
            this.paginator.length = this.totalUsers;
          }
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', this.snackBarConfig);
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

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { user: null, roles: this.roles }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  openEditUserDialog(user: User): void {
    console.log('Opening edit user dialog for user:', user);
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { user: { ...user }, roles: user.roles }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser(user.id, result);
      }
    });
  }

  createUser(user: Partial<User>): void {
    this.usersService.createUser(user).subscribe({
      next: (newUser) => {
        this.snackBar.open('User created successfully', 'Close', this.snackBarConfig);
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Error creating user', 'Close', this.snackBarConfig);
        console.error('Error creating user:', error);
      }
    });
  }

  updateUser(id: number, user: Partial<User>): void {
    this.usersService.updateUser(id, user).subscribe({
      next: (updatedUser) => {
        this.snackBar.open('User updated successfully', 'Close', this.snackBarConfig);
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Error updating user', 'Close', this.snackBarConfig);
        console.error('Error updating user:', error);
      }
    });
  }

  toggleUser(id: number, active: boolean) {
    this.usersService.updateUser(id, { isActive: active }).subscribe({
      next: (updatedUser) => {
        this.snackBar.open('User updated successfully', 'Close', this.snackBarConfig);
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Error updating user', 'Close', this.snackBarConfig);
        console.error('Error updating user:', error);
      }
    })
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', this.snackBarConfig);
          this.loadUsers();
        },
        error: (error) => {
          this.snackBar.open('Error deleting user', 'Close', this.snackBarConfig);
          console.error('Error deleting user:', error);
        }
      });
    }
  }
}