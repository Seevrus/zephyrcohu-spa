import {
  type FieldContext,
  type ValidationError,
  type ValidationResult,
} from "@angular/forms/signals";

export function richTextRequiredValidator({
  value,
}: FieldContext<string>): ValidationResult<ValidationError.WithoutFieldTree> {
  if (
    value()
      .replaceAll(/<[^<>]*>/g, "")
      .trim().length > 0
  ) {
    return null;
  }

  return {
    kind: "required",
    message: "Kötelező mező",
  };
}
