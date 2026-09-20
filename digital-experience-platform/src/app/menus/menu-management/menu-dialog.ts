import { Component, inject, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
// Import Material modules
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'

import { Menu } from '../../models/menu.model'
import { Role } from '../../models/role.model'

export interface MenuDialogData {
  menu: Menu | null
  roles: Role[]
}

@Component({
  selector: 'app-menu-dialog',
  templateUrl: './menu-dialog.html',
  styleUrl: './menu-dialog.scss',
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
  ],
})
export class MenuDialogComponent implements OnInit {
  menuForm: FormGroup
  allRoles: Role[] = []
  public data: MenuDialogData = inject(MAT_DIALOG_DATA)
  private fb: FormBuilder = inject(FormBuilder)
  public dialogRef: MatDialogRef<MenuDialogComponent> = inject(MatDialogRef<MenuDialogComponent>)
  constructor() {
    if (!this.data.roles) {
      this.data.roles = []
    }

    this.menuForm = this.fb.group({
      name: ['', Validators.required],
      title: ['', Validators.required],
      icon: ['', Validators.required],
      route: ['', Validators.required],
      order: [0, Validators.required],
      parentId: [0],
      isActive: [true],
      roles: [[], Validators.required],
    })
  }

  ngOnInit(): void {
    const generalRoles = this.data.roles || []
    if (this.data.menu?.roles) {
      const roleMap = new Map<number, Role>()
      generalRoles.forEach((role) => roleMap.set(role.id, role))
      this.data.menu.roles.forEach((role) => roleMap.set(role.id, role))

      this.allRoles = Array.from(roleMap.values())
    } else {
      this.allRoles = generalRoles
    }

    if (this.data.menu) {
      this.menuForm.patchValue({
        name: this.data.menu.name || '',
        title: this.data.menu.title || '',
        icon: this.data.menu.icon || '',
        route: this.data.menu.route || '',
        order: this.data.menu.order || 0,
        parentId: this.data.menu.parentId || 0,
        isActive: this.data.menu.isActive !== undefined ? this.data.menu.isActive : true,
        roles: this.data.menu.roles,
      })
    }
  }

  onSave(): void {
    if (this.menuForm.valid) {
      this.dialogRef.close(this.menuForm.value)
    }
  }

  compareRoles(role1: Role, role2: Role): boolean {
    return role1.id === role2.id
  }
}
