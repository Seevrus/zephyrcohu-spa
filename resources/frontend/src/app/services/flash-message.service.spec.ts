import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { FlashMessageService } from "./flash-message.service";

describe("Flash Message Service", () => {
  let flashMessageService: FlashMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FlashMessageService, provideZonelessChangeDetection()],
    });

    flashMessageService = TestBed.inject(FlashMessageService);
  });

  test("consume should return undefined when no message is pending", () => {
    expect(flashMessageService.consume()).toBeUndefined();
  });

  test("consume should return the pending message exactly once", () => {
    flashMessageService.set("A felhasználó adatai módosultak.");

    expect(flashMessageService.consume()).toBe(
      "A felhasználó adatai módosultak.",
    );
    expect(flashMessageService.consume()).toBeUndefined();
  });

  test("set should replace a message that has not been consumed yet", () => {
    flashMessageService.set("Első üzenet");
    flashMessageService.set("Második üzenet");

    expect(flashMessageService.consume()).toBe("Második üzenet");
  });
});
