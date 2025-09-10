import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
    ReactiveFormsModule
  ]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {
    if (!this.data.roles) {
      this.data.roles = [];
    }
    
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      nickname: ['', Validators.required],
      isActive: [true, Validators.required],
      roles: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.user) {
      this.userForm.patchValue({
        username: this.data.user.username || '',
        nickname: this.data.user.nickname || '',
        isActive: this.data.user.isActive !== undefined ? this.data.user.isActive : true,
        roles: this.data.user.roles || []
      });
    }
  }

  onSave(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      this.dialogRef.close(formData);
    }
  }
}