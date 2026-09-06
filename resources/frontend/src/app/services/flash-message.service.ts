import { Service, signal } from "@angular/core";

/**
 * Carries a one-shot message across a navigation: the page that finished the
 * work calls `set` before navigating, and the page it navigates to calls
 * `consume` to read and clear it.
 */
@Service()
export class FlashMessageService {
  private readonly message = signal<string | undefined>(undefined);

  set(message: string) {
    this.message.set(message);
  }

  consume() {
    const message = this.message();
    this.message.set(undefined);

    return message;
  }
}
