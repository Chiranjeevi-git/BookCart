import { AsyncPipe } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from "@angular/material/card";
import { MatOption } from "@angular/material/core";
import {
  MatError,
  MatFormField,
  MatLabel,
  MatPrefix,
} from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatSelect } from "@angular/material/select";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { ReplaySubject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Book } from "src/app/models/book";
import { BookService } from "src/app/services/book.service";
import { SnackbarService } from "src/app/services/snackbar.service";
import { loadCategories } from "src/app/state/actions/categories.actions";
import { selectCategories } from "src/app/state/selectors/categories.selectors";

@Component({
  selector: "app-book-form",
  templateUrl: "./book-form.component.html",
  styleUrls: ["./book-form.component.scss"],
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
    MatPrefix,
    MatCardActions,
    MatButton,
    MatIcon,
    AsyncPipe,
  ],
})
export class BookFormComponent implements OnInit, OnDestroy {
  private readonly bookService = inject(BookService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBarService = inject(SnackbarService);
  private readonly formData = new FormData();
  private destroyed$ = new ReplaySubject<void>(1);
  private readonly store = inject(Store);

  book: Book = new Book();
  formTitle = "Add";
  coverImagePath;
  bookId;
  files;
  categoryList = this.store.select(selectCategories);

  bookForm = this.fb.group({
    bookId: 0,
    title: ["", Validators.required],
    author: ["", Validators.required],
    category: ["", Validators.required],
    price: ["", [Validators.required, Validators.min(0)]],
  });

  protected get movieFormControl() {
    return this.bookForm.controls;
  }

  constructor() {
    this.store.dispatch(loadCategories());
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroyed$)).subscribe((params) => {
      if (params.id) {
        this.bookId = +params.id;
        this.fetchBookData();
      }
    });
  }

  onFormSubmit() {
    if (!this.bookForm.valid) {
      return;
    }
    if (this.files && this.files.length > 0) {
      for (let j = 0; j < this.files.length; j++) {
        this.formData.append("file" + j, this.files[j]);
      }
    }
    this.formData.append("bookFormData", JSON.stringify(this.bookForm.value));

    if (this.bookId) {
      this.editBookDetails();
    } else {
      this.saveBookDetails();
    }
  }

  uploadImage(event) {
    this.files = event.target.files;
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = (myevent: ProgressEvent) => {
      this.coverImagePath = (myevent.target as FileReader).result;
    };
  }

  navigateToAdminPanel() {
    this.router.navigate(["/admin/books"]);
  }

  private fetchBookData() {
    this.formTitle = "Edit";
    this.bookService
      .getBookById(this.bookId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (result: Book) => {
          this.setBookFormData(result);
        },
        error: (error) => {
          console.log("Error ocurred while fetching book data : ", error);
        },
      });
  }

  private editBookDetails() {
    this.bookService
      .updateBookDetails(this.formData)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.snackBarService.showSnackBar(
            "The book data is updated successfully."
          );
          this.navigateToAdminPanel();
        },
        error: (error) => {
          console.log("Error ocurred while updating book data : ", error);
        },
      });
  }

  private saveBookDetails() {
    this.bookService
      .addBook(this.formData)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.snackBarService.showSnackBar(
            "The book data is added successfully."
          );
          this.navigateToAdminPanel();
        },
        error: (error) => {
          this.bookForm.reset();
          console.log("Error ocurred while adding book data : ", error);
        },
      });
  }

  private setBookFormData(bookFormData) {
    this.bookForm.setValue({
      bookId: bookFormData.bookId,
      title: bookFormData.title,
      author: bookFormData.author,
      category: bookFormData.category,
      price: bookFormData.price,
    });
    this.coverImagePath = "/Upload/" + bookFormData.coverFileName;
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
