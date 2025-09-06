import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../services/auth/auth.service';
import { BooksService } from '../services/books.service';
import {  MatSnackBarModule } from '@angular/material/snack-bar';
import { AsyncPipe } from '@angular/common';
import { RoleDirective } from '../services/auth/role.directive';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    RoleDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  booksService = inject(BooksService);
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRandomBooks();
  }

  loadRandomBooks(): void {
    this.booksService.refreshBooks();
  }

  logout(): void {
    this.authService.logout();
  }

  viewBookDetails(bookId: number): void {
    this.router.navigate(['/books', bookId]);
  }
}