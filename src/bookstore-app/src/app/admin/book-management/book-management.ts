import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
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
    AsyncPipe
  ]
})
export class BookManagementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  books: MatTableDataSource<Book> = new MatTableDataSource<Book>([]);
  booksService = inject(BooksService);
  displayedColumns: string[] = ['title', 'isbn', 'price', 'publishDate', 'actions'];
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  totalBooks = 0;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ){}

  ngOnInit(): void {    
    this.loadBooks();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      // Set up paginator after view init
      this.books.paginator = this.paginator;
      
      this.paginator.page.subscribe((event: PageEvent) => {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadBooks();
      });
    }
  }

  loadBooks(): void {
    this.booksService.booksState$.subscribe(state => {
      if (state?.data) {
        this.books.data = state.data;
      }
    });

    this.booksService.refreshBooks()
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
            this.loadBooks(); // Refresh the list
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
          next: (updatedBook) => {
            this.snackBar.open(`Book "${updatedBook.title}" updated successfully`, 'Close', {
              duration: 3000
            });
            this.loadBooks(); // Refresh the list
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
          this.snackBar.open('Book deleted successfully', 'Close', {
            duration: 3000
          });
          this.loadBooks(); // Refresh the list
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