import { FormControl, FormGroup } from "@angular/forms";

import { passwordMatchValidator } from "./password-match.validator";

describe("passwordMatchValidator", () => {
  const testGroup = new FormGroup({
    password: new FormControl(""),
    passwordAgain: new FormControl(""),
  });

  beforeEach(() => {
    testGroup.reset();
  });

  test("returns null if the password is missing", () => {
    testGroup.setValue({
      password: "",
      passwordAgain: "abc123",
    });

    const validationResult = passwordMatchValidator(testGroup);

    expect(validationResult).toBeNull();
  });

  test("returns null if the second password is missing", () => {
    testGroup.setValue({
      password: "abc123",
      passwordAgain: "",
    });

    const validationResult = passwordMatchValidator(testGroup);

    expect(validationResult).toBeNull();
  });

  test("returns null if the passwords match", () => {
    testGroup.setValue({
      password: "abc123",
      passwordAgain: "abc123",
    });

    const validationResult = passwordMatchValidator(testGroup);

    expect(validationResult).toBeNull();
  });

  test("returns with 'passwordsDontMatch' if the passwords don't match", () => {
    testGroup.setValue({
      password: "abc123",
      passwordAgain: "abv123",
    });

    testGroup.markAllAsDirty();

    const validationResult = passwordMatchValidator(testGroup);

    expect(validationResult).toStrictEqual({
      passwordsDontMatch: true,
    });
  });
});
