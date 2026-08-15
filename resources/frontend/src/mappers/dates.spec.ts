import { formatDisplayDate, formatDisplayDateWithoutDay } from "./dates";

describe("dates", () => {
  test("formatDisplayDate returns the correct localized format", () => {
    expect(formatDisplayDate(new Date("2026-02-08T18:26:00.000000Z"))).toBe(
      "2026. február 8. vasárnap",
    );
  });

  test("formatDisplayDateWithoutDay returns the correct localized format", () => {
    expect(
      formatDisplayDateWithoutDay(new Date("2026-02-08T18:26:00.000000Z")),
    ).toBe("2026. február 8.");
  });
});
