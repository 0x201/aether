import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Book, BookDto } from '../../models/book.model';

export interface BookFormDialogData {
  book?: Book;
}

@Component({
  selector: 'app-book-form',
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookFormComponent implements OnInit {
  bookForm: FormGroup;
  isEditMode: boolean;
  data: BookFormDialogData = inject(MAT_DIALOG_DATA);

  constructor(
    public dialogRef: MatDialogRef<BookFormComponent>,
    private fb: FormBuilder,
  ) {
    this.isEditMode = !!this.data.book;

    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      isbn: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      publishDate: [''],
      description: [''],
      authorIds: ['']
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.book) {
      const book = this.data.book;
      this.bookForm.patchValue({
        title: book.title,
        isbn: book.isbn,
        price: book.price,
        publishDate: book.publishDate,
        description: book.description,
        authorIds: book.bookAuthors.map(ba => ba.authorId).join(','),
      });
    }
  }

  onSubmit(): void {
    if (this.bookForm.valid) {
      const formValue = this.bookForm.value;
      const bookDto: BookDto = {
        title: formValue.title,
        isbn: formValue.isbn,
        price: formValue.price,
        publishDate: formValue.publishDate,
        description: formValue.description,
        authorIds: this.parseAuthorIds(formValue.authorIds)
      };

      this.dialogRef.close({
        book: bookDto,
        isEditMode: this.isEditMode,
        id: this.isEditMode ? this.data.book?.id : null
      });
    }
  }

  private parseAuthorIds(authorIdsString: string): number[] {
    if (!authorIdsString) {
      return [];
    }

    return authorIdsString
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
  }
}