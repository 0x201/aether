import { ChangeDetectionStrategy, Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Book } from '../../models/book.model';
import { MatSelectModule } from '@angular/material/select';
import { Author } from '../../models/author.model';

export interface BookFormDialogData {
  book: Book | null;
  authors: Author[];
}

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.html',
  styleUrl: './book-dialog.scss',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDialogComponent implements OnInit {
  bookForm: FormGroup;
  allAuthors: Author[] = [];
  private fb: FormBuilder = inject(FormBuilder);
  public data: BookFormDialogData = inject(MAT_DIALOG_DATA);

  constructor(public dialogRef: MatDialogRef<BookDialogComponent>) {
    if (!this.data.authors) {
      this.data.authors = [];
    }

    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      isbn: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      publishDate: [''],
      description: [''],
      isActive: [true],
      authors: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    const generalAuthors = this.data.authors || [];
    if (this.data.book?.authors) {
      const authorMap = new Map<number, Author>();
      console.log("data:", this.data);
      generalAuthors.forEach(author => authorMap.set(author.id, author));
      this.data.book.authors.forEach(author => authorMap.set(author.id, author));

      this.allAuthors = Array.from(authorMap.values());
    } else {
      this.allAuthors = generalAuthors;
    }

    if (this.data.book) {
      const book = this.data.book;
      this.bookForm.patchValue({
        title: book.title,
        isbn: book.isbn,
        price: book.price,
        publishDate: book.publishDate,
        description: book.description,
        isActive: this.data.book.isActive !== undefined ? this.data.book.isActive : true,
        authors: this.data.book.authors
      });
    }
  }

  onSave(): void {
    if (this.bookForm.valid) {
      this.dialogRef.close(this.bookForm.valid);
    }
  }

  compareAuthors(author1: Author, author2: Author): boolean {
    return author1 && author2 && author1.id === author2.id;
  }
}