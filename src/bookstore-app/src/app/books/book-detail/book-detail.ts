import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BooksService } from '../../services/books.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailComponent implements OnInit {
  booksService = inject(BooksService)
  bookId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bookId = +idParam;
      this.loadBook();
    }
  }

  loadBook(): void {
    if (this.bookId) {
      this.booksService.getBook(this.bookId).subscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/books']);
  }

  addToCart(): void {
    // this.booksService$.subscribe(book => {
    //   if (book) {
    //     // In a real application, this would add the book to a cart service
    //     this.snackBar.open(`${book.title} added to cart`, 'Close', {
    //       duration: 3000
    //     });
    //   }
    // });
  }
}