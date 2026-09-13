import { Service } from "@angular/core";

@Service()
export class DelayService {
  /**
   * Resolves after `ms`, or as soon as `abort` resolves — whichever happens
   * first. An aborted wait clears its timer, so nothing stays pending.
   */
  wait(ms: number, abort?: Promise<void>) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);

      void abort?.then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}
