import { Component } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: "app-login",
  host: {
    class: "app-login",
  },
  imports: [MatButton, MatFormField, MatInputModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent {
  isPasswordVisible = false;

  readonly loginForm = new FormGroup({
    email: new FormControl("", {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      validators: [
        Validators.required,
        Validators.pattern(/^([a-zA-ZíűáéúőóüöÍŰÁÉÚŐÓÜÖ0-9._+#%@-]){8,}$/),
      ],
    }),
  });

  onSubmit() {
    console.log(this.loginForm);
  }

  togglePassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
