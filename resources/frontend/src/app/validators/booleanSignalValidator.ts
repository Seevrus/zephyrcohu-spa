import {
  type FieldContext,
  type ValidationError,
  type ValidationResult,
} from "@angular/forms/signals";

export function booleanSignalValidator({
  value,
}: FieldContext<boolean>): ValidationResult<ValidationError.WithoutField> {
  if (value()) {
    return null;
  }

  return {
    kind: "boolean",
    message: "A jelölőnégyzet kijelölése kötelező.",
  };
}
