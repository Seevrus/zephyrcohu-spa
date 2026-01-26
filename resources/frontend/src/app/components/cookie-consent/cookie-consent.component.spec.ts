import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";

import { CookieConsentComponent } from "./cookie-consent.component";

describe("CookieConsentComponent", () => {
  const user = userEvent.setup();

  test("should render the component", async () => {
    const { container } = await renderCookieConsentComponent();

    screen.debug();

    expect(container.querySelector(".mat-mdc-card-title")).toHaveTextContent(
      "Az Ön adatainak védelme fontos számunkra",
    );

    expect(container.querySelector(".mat-mdc-card-content")!.innerHTML).toBe(
      '<p _ngcontent-a-c3879759804=""> Az oldal biztonságos működése érdekében sütiket használunk. Nem használjuk fel az Ön adatait sem elemzési, sem hirdetési célokra és nem is adjuk tovább azokat semmilyen harmadik fél számára. </p><p _ngcontent-a-c3879759804=""> Bővebb információért kérjük olvassa el <a _ngcontent-a-c3879759804="" href="#" class="zephyr-link">adatvédelmi tájékoztatónkat.</a></p>',
    );
  });

  test("should emit the cookiesAccepted event when the accept button is clicked", async () => {
    const { fixture } = await renderCookieConsentComponent();
    const componentInstance = fixture.componentInstance;

    const cookiesAcceptedSpy = vi.spyOn(
      componentInstance.cookiesAccepted,
      "emit",
    );

    const acceptButton = screen.getByTestId("accept-cookies-button");
    await user.click(acceptButton);

    expect(cookiesAcceptedSpy).toHaveBeenCalledTimes(1);

    cookiesAcceptedSpy.mockRestore();
  });
});

function renderCookieConsentComponent() {
  return render(CookieConsentComponent);
}
