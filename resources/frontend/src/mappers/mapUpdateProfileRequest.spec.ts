import { mapUpdateProfileRequest } from "./mapUpdateProfileRequest";

describe("mapUpdateProfileRequest", () => {
  test("leaves input as is if everything is specified", () => {
    const profile = {
      email: "test@test.com",
      password: "test",
      newsletter: true,
    };

    expect(mapUpdateProfileRequest(profile)).toStrictEqual({
      email: "test@test.com",
      password: "test",
      newsletter: true,
    });
  });

  test("keeps false value", () => {
    const profile = {
      email: "test@test.com",
      password: "test",
      newsletter: false,
    };

    expect(mapUpdateProfileRequest(profile)).toStrictEqual({
      email: "test@test.com",
      password: "test",
      newsletter: false,
    });
  });

  test("omits null and undefined values", () => {
    const profile = {
      email: null,
      password: undefined,
      newsletter: false,
    };

    expect(mapUpdateProfileRequest(profile)).toStrictEqual({
      newsletter: false,
    });
  });
});
