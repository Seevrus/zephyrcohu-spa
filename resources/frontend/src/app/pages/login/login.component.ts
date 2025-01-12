import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
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
  private readonly formBuilder = inject(FormBuilder);
  isPasswordVisible = false;

  readonly loginForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    password: [
      "",
      [
        Validators.required,
        Validators.pattern(/^([a-zA-ZíűáéúőóüöÍŰÁÉÚŐÓÜÖ0-9._+#%@-]){8,}$/),
      ],
    ],
  });

  get email() {
    return this.loginForm.get("email");
  }

  get password() {
    return this.loginForm.get("password");
  }

  onSubmit() {
    console.log(this.loginForm);
  }

  togglePassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
