import { type AbstractControl, type ValidationErrors } from "@angular/forms";

export function passwordMatchValidator(
  passwords: AbstractControl,
): ValidationErrors | null {
  const password: unknown = passwords.get("password")?.value;
  const passwordAgain: unknown = passwords.get("passwordAgain")?.value;

  return password && passwordAgain && password !== passwordAgain
    ? { passwordsDontMatch: true }
    : null;
}
