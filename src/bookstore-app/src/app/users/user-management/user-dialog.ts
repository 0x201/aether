import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RolesService } from '../../services/roles.service';
import { debounceTime, distinctUntilChanged, map, Observable, of, startWith, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
export interface UserDialogData {
  user: User | null;
  roles: Role[];
}

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    AsyncPipe,
  ]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  allRoles: Role[] = [];
  filteredRoles: Observable<Role[]> = of([]);
  roleSearchControl: FormControl<string | null>;

  rolesService = inject(RolesService);
  private fb: FormBuilder = inject(FormBuilder);
  public dialogRef: MatDialogRef<UserDialogComponent> = inject(MatDialogRef<UserDialogComponent>);
  public data: UserDialogData = inject(MAT_DIALOG_DATA);

  constructor() {
    if (!this.data.roles) {
      this.data.roles = [];
    }

    this.roleSearchControl = this.fb.control('')

    this.userForm = this.fb.group({
      username: ['', Validators.required],
      nickname: ['', Validators.required],
      isActive: [true, Validators.required],
      roles: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    const generalRoles = this.data.roles || [];
    if (this.data.user?.roles) {
      const roleMap = new Map<number, Role>();
      generalRoles.forEach(role => roleMap.set(role.id, role));
      this.data.user.roles.forEach(role => roleMap.set(role.id, role));

      this.allRoles = Array.from(roleMap.values());
    } else {
      this.allRoles = generalRoles;
    }
    if (this.data.user) {
      this.userForm.patchValue({
        username: this.data.user.username || '',
        nickname: this.data.user.nickname || '',
        isActive: this.data.user.isActive !== undefined ? this.data.user.isActive : true,
        roles: this.data.user.roles
      });
    }

    this.setupRoleSearch();
  }

  setupRoleSearch(): void {
    this.filteredRoles = this.roleSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const filter = value || "";
        if (filter.length < 1) {
          return of(this.allRoles);
        }
        const query = {
          filter: filter,
          page: 0,
          pageSize: 10
        }
        return this.rolesService.getRoles(query).pipe(
          map(result => result.data)
        );
      }),
    );
  }

  onRoleSearchKeyUp(event: any): void {
    this.roleSearchControl.setValue(event.target.value);
  }

  onSave(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      this.dialogRef.close(formData);
    }
  }

  compareRoles(role1: Role, role2: Role): boolean {
    return role1.id === role2.id;
  }
}