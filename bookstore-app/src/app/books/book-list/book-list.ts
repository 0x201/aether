import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BooksService } from "../../services/books.service";

@Component({
  selector: "app-book-list",
  templateUrl: "./book-list.html",
  styleUrl: "./book-list.scss",
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
export class BookListComponent implements OnInit {
  booksService = inject(BooksService);
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.booksService.refreshBooks();
  }

  viewDetails(bookId: number): void {
    this.router.navigate(["/books", bookId]);
  }
}
