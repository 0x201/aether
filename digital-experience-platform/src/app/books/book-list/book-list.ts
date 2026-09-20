import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { Router, RouterModule } from '@angular/router'

import { BooksService } from '../../services/books.service'

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookList implements OnInit {
  booksService = inject(BooksService)
  router = inject(Router)

  ngOnInit(): void {
    this.loadBooks()
  }

  loadBooks(): void {
    this.booksService.refreshBooks()
  }

  viewDetails(bookId: number): void {
    this.router.navigate(['/books', bookId])
  }
}
