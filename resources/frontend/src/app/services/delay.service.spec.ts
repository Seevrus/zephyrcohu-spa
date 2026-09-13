import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { DelayService } from "./delay.service";

describe("Delay Service", () => {
  let delayService: DelayService;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [DelayService, provideZonelessChangeDetection()],
    });

    delayService = TestBed.inject(DelayService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("wait resolves only once the requested delay elapsed", async () => {
    let resolved = false;
    const waiting = delayService.wait(1000).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(999);

    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await waiting;

    expect(resolved).toBe(true);
  });

  test("wait resolves as soon as the abort promise resolves, without waiting out the delay", async () => {
    let abort!: () => void;
    const aborted = new Promise<void>((resolve) => {
      abort = resolve;
    });

    let resolved = false;
    const waiting = delayService.wait(60_000, aborted).then(() => {
      resolved = true;
    });

    abort();
    await waiting;

    expect(resolved).toBe(true);
  });

  test("wait leaves no pending timer behind when it is aborted", async () => {
    let abort!: () => void;
    const aborted = new Promise<void>((resolve) => {
      abort = resolve;
    });

    const waiting = delayService.wait(60_000, aborted);

    abort();
    await waiting;

    expect(vi.getTimerCount()).toBe(0);
  });
});
