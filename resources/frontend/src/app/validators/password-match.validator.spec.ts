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

  test.each([
    {
      label: "the password is missing",
      password: "",
      passwordAgain: "abc123",
    },
    {
      label: "the second password is missing",
      password: "abc123",
      passwordAgain: "",
    },
    {
      label: "the passwords match",
      password: "abc123",
      passwordAgain: "abc123",
    },
  ])("returns null if $label", ({ password, passwordAgain }) => {
    testGroup.setValue({ password, passwordAgain });

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
