import { formatDisplayDate } from "./dates";

describe("dates", () => {
  test("formatDisplayDate returns the correct localized format", () => {
    expect(formatDisplayDate(new Date("2026-02-08T18:26:00.000000Z"))).toBe(
      "2026. február 8. vasárnap",
    );
  });
});
