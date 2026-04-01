import { Component, OnInit, ViewChild, inject, ChangeDetectionStrategy, effect, untracked } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Book } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { BookDialogComponent } from './book-dialog';

// Import Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthorsService } from '../../services/authors.service';
import { Author } from '../../models/author.model';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-book-management',
  templateUrl: './book-management.html',
  styleUrl: './book-management.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  books: MatTableDataSource<Book> = new MatTableDataSource<Book>([]);
  authors: Author[] = [];
  displayedColumns: string[] = ['title', 'isbn', 'price', 'publishDate', 'authors', 'actions'];
  
  pageSize = 10;
  currentPage = 0;
  totalBooks = 0;
  snackBarConfig: MatSnackBarConfig = { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' };

  booksService = inject(BooksService);
  authorsService = inject(AuthorsService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  // 使用 effect 监听 booksService 中的 signal 状态
  booksEffect = effect(() => {
    const state = this.booksService.booksState$();
    if (state?.data) {
      untracked(() => {
        this.books.data = state.data ?? [];
        if (this.paginator) {
          this.paginator.length = this.totalBooks;
        }
      });
    }
  });

  ngOnInit(): void {
    this.loadBooks();
    this.loadAuthors();
  }

  loadAuthors(): void {
    this.authorsService.getAllAuthors().subscribe({
      next: (result) => {
        this.authors = result;
      },
      error: (error) => {
        console.error('Error loading authors:', error);
        this.snackBar.open('Error loading authors', 'Close', this.snackBarConfig);
      }
    });
  }

  loadBooks(): void {
    this.booksService
      .getBooks(this.currentPage, this.pageSize)
      .subscribe({
        next: (result) => {
          this.totalBooks = result.totalCount;
          if (this.paginator) {
            this.paginator.length = this.totalBooks;
          }
        },
        error: (error) => {
          console.error('Error loading books:', error);
          this.snackBar.open('Error loading books', 'Close', this.snackBarConfig);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBooks();
  }

  openAddBookDialog(): void {
    const dialogRef = this.dialog.open(BookDialogComponent, {
      width: '500px',
      data: { book: null, authors: this.authors }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.booksService.createBook(result.book).subscribe({
          next: (book) => {
            this.snackBar.open(`Book "${book.title}" created successfully`, 'Close', this.snackBarConfig);
            this.loadBooks();
          },
          error: (error) => {
            this.snackBar.open('Error creating book', 'Close', this.snackBarConfig);
            console.error('Error creating book:', error);
          }
        });
      }
    });
  }

  openEditBookDialog(book: Book): void {
    const dialogRef = this.dialog.open(BookDialogComponent, {
      width: '500px',
      data: { book: { ...book }, authors: this.authors }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEditMode) {
        this.booksService.updateBook(result.id, result.book).subscribe({
          next: () => {
            this.snackBar.open(`Book updated successfully`, 'Close', this.snackBarConfig);
            this.loadBooks();
          },
          error: (error) => {
            this.snackBar.open('Error updating book', 'Close', this.snackBarConfig);
            console.error('Error updating book:', error);
          }
        });
      }
    });
  }

  deleteBook(id: number): void {
    if (confirm('Are you sure you want to delete this book?')) {
      this.booksService.deleteBook(id).subscribe({
        next: () => {
          this.snackBar.open('Book deleted successfully', 'Close', this.snackBarConfig);
          this.loadBooks();
        },
        error: (error) => {
          this.snackBar.open('Error deleting book', 'Close', this.snackBarConfig);
          console.error('Error deleting book:', error);
        }
      });
    }
  }
}