import { provideZonelessChangeDetection } from "@angular/core";
import { render } from "@testing-library/angular";

import { FooterComponent } from "./footer.component";

describe("Footer Component", () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date("2025-08-31"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("should have the correct navigation items", async () => {
    const { container } = await renderFooter();

    const footerNavLabels = container.querySelectorAll(
      ".footer-actions > a > .mdc-button__label",
    );

    expect([...footerNavLabels].map((link) => link?.textContent)).toEqual([
      "Kapcsolat",
      "Honlaptérkép",
      "Adatvédelmi tájékoztató",
    ]);
  });

  test("should have the correct copyright notice", async () => {
    const { container } = await renderFooter();

    const copyrightElement = container.querySelector(".copyright-notice");

    expect(copyrightElement).toHaveTextContent(
      "Copyright © Zephyr Számítástechnikai Fejlesztő és Gazdasági Szolgáltató Bt. 2018-2025.",
    );
  });
});

async function renderFooter() {
  return render(FooterComponent, {
    providers: [provideZonelessChangeDetection()],
  });
}
