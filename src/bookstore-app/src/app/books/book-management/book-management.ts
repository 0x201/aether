import { Component, OnInit, ViewChild, AfterViewInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { BooksService } from '../../services/books.service';
import { Book } from '../../models/book.model';
import { BookFormComponent } from '../book-form/book-form';
import { AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-book-management',
  templateUrl: './book-management.html',
  styleUrl: './book-management.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    AsyncPipe,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  books: MatTableDataSource<Book> = new MatTableDataSource<Book>([]);
  booksService = inject(BooksService);
  displayedColumns: string[] = ['title', 'isbn', 'price', 'publishDate', 'actions'];

  pageSize = 10;
  currentPage = 0;
  totalBooks = 0;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.booksService.booksState$.subscribe(state => {
      if (state?.data) {
        this.books.data = state.data;
        if (this.paginator) {
          this.paginator.length = this.totalBooks;
        }
      }
    });

    this.booksService.getBooks(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.totalBooks = result.totalCount;
        if (this.paginator) {
          this.paginator.length = this.totalBooks;
        }
        this.books.data = result.items;
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.snackBar.open('Error loading books', 'Close', {
          duration: 3000
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBooks();
  }

  openAddBookDialog(): void {
    const dialogRef = this.dialog.open(BookFormComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.booksService.createBook(result.book).subscribe({
          next: (book) => {
            this.snackBar.open(`Book "${book.title}" created successfully`, 'Close', {
              duration: 3000
            });
            this.currentPage = 0;
            if (this.paginator) {
              this.paginator.firstPage();
            }
            this.loadBooks();
          },
          error: (error) => {
            console.error('Error creating book:', error);
            this.snackBar.open('Error creating book', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  editBook(book: Book): void {
    const dialogRef = this.dialog.open(BookFormComponent, {
      width: '500px',
      data: { book }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEditMode) {
        this.booksService.updateBook(result.id, result.book).subscribe({
          next: () => {
            this.snackBar.open(`Book "${book.title}" updated successfully`, 'Close', {
              duration: 3000
            });
            this.currentPage = 0;
            if (this.paginator) {
              this.paginator.firstPage();
            }
            this.loadBooks();
          },
          error: (error) => {
            console.error('Error updating book:', error);
            this.snackBar.open('Error updating book', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  deleteBook(id: number): void {
    if (confirm('Are you sure you want to delete this book?')) {
      this.booksService.deleteBook(id).subscribe({
        next: () => {
          this.snackBar.open(`Book with ID: ${id} deleted successfully`, 'Close', {
            duration: 3000
          });
          this.currentPage = 0;
          if (this.paginator) {
            this.paginator.firstPage();
          }
          this.loadBooks();
        },
        error: (error) => {
          console.error('Error deleting book:', error);
          this.snackBar.open('Error deleting book', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}