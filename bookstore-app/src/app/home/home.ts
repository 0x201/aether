import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { BooksService } from "../services/books.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";

@Component({
  selector: "app-home",
  templateUrl: "./home.html",
  styleUrl: "./home.scss",
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  booksService = inject(BooksService);
  router = inject(Router);

  ngOnInit(): void {
    this.loadRandomBooks();
  }

  loadRandomBooks(): void {
    this.booksService.refreshBooks();
  }

  viewBookDetails(bookId: number): void {
    this.router.navigate(["/books", bookId]);
  }
}
