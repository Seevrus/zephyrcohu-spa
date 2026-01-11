import { type AbstractControl, type ValidationErrors } from "@angular/forms";

export function passwordMatchValidator(
  passwords: AbstractControl,
): ValidationErrors | null {
  const password = passwords.get("password");
  const passwordAgain = passwords.get("passwordAgain");

  return password?.dirty &&
    passwordAgain?.dirty &&
    password?.value !== passwordAgain?.value
    ? { passwordsDontMatch: true }
    : null;
}
