import {
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
  effect,
  untracked,
} from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialog } from '@angular/material/dialog'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTableDataSource } from '@angular/material/table'
import { MatTableModule } from '@angular/material/table'

import { Role } from '../../models/role.model'
import { User } from '../../models/user.model'
import { RolesService } from '../../services/roles.service'
import { UsersService } from '../../services/users.service'
import { UserDialogComponent } from './user-dialog'

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
    MatCheckbox,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator
  users = new MatTableDataSource<User>()
  roles: Role[] = []
  displayedColumns: string[] = ['username', 'nickname', 'roles', 'isActive', 'actions']
  pageSize = 10
  currentPage = 0
  totalUsers = 0
  snackBarConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  }
  usersService = inject(UsersService)
  rolesService = inject(RolesService)
  snackBar = inject(MatSnackBar)
  dialog: MatDialog = inject(MatDialog)

  // 使用 effect 监听 usersService 中的 signal 状态
  usersEffect = effect(() => {
    const state = this.usersService.usersState$()
    if (state?.data) {
      untracked(() => {
        this.users.data = state.data ?? []
        if (this.paginator) {
          this.paginator.length = this.totalUsers
        }
      })
    }
  })

  ngOnInit(): void {
    this.loadUsers()
    this.loadRoles()
  }

  loadUsers(): void {
    this.usersService.getUsers(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.users.data = res.data
        this.totalUsers = res.totalCount
        if (this.paginator) {
          this.paginator.length = res.totalCount
        }
      },
      error: (error) => {
        console.error('Error loading users:', error)
        this.snackBar.open('Error loading users', 'Close', this.snackBarConfig)
      },
    })
  }

  loadRoles(): void {
    this.rolesService.getAllRoles().subscribe({
      next: (result) => {
        this.roles = result
      },
      error: (error) => {
        console.error('Error loading roles:', error)
        this.snackBar.open('Error loading roles', 'Close', this.snackBarConfig)
      },
    })
  }

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      data: { user: null, roles: this.roles },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers() // Refresh the user list
      }
    })
  }

  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      data: { user, roles: this.roles },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers() // Refresh the user list
      }
    })
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex
    this.pageSize = event.pageSize
    this.loadUsers()
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.usersService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers()
          this.snackBar.open('User deleted successfully', 'Close', this.snackBarConfig)
        },
        error: (error) => {
          console.error('Error deleting user:', error)
          this.snackBar.open('Error deleting user', 'Close', this.snackBarConfig)
        },
      })
    }
  }

  toggleUser(userId: number, isActive: boolean): void {
    this.usersService.updateUserStatus(userId, isActive).subscribe({
      next: () => {
        this.loadUsers() // Refresh the user list
        this.snackBar.open('User status updated successfully', 'Close', this.snackBarConfig)
      },
      error: (error) => {
        console.error('Error updating user status:', error)
        this.snackBar.open('Error updating user status', 'Close', this.snackBarConfig)
      },
    })
  }
}
