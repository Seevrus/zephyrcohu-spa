import { FormControl, FormGroup } from "@angular/forms";

import { passwordMatchValidator } from "./password-match.directive";

describe("passwordMatchValidator", () => {
  const testGroup = new FormGroup({
    password: new FormControl(""),
    passwordAgain: new FormControl(""),
  });

  beforeEach(() => {
    testGroup.reset();
  });

  it("returns null if the password is missing", () => {
    testGroup.setValue({
      password: "",
      passwordAgain: "abc123",
    });

    const validationResult = passwordMatchValidator(testGroup);
    expect(validationResult).toBeNull();
  });

  it("returns null if the second password is missing", () => {
    testGroup.setValue({
      password: "abc123",
      passwordAgain: "",
    });

    const validationResult = passwordMatchValidator(testGroup);
    expect(validationResult).toBeNull();
  });

  it("returns null if the passwords match", () => {
    testGroup.setValue({
      password: "abc123",
      passwordAgain: "abc123",
    });

    const validationResult = passwordMatchValidator(testGroup);
    expect(validationResult).toBeNull();
  });

  it("returns with 'passwordsDontMatch' if the passwords don't match", () => {
    testGroup.setValue({
      password: "abc123",
      passwordAgain: "abv123",
    });

    const validationResult = passwordMatchValidator(testGroup);
    expect(validationResult).toEqual({
      passwordsDontMatch: true,
    });
  });
});
