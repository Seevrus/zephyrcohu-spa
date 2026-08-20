import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";

import { RequestQuoteSuccessComponent } from "./request-quote-success.component";

describe("RequestQuoteSuccessComponent", () => {
  test("should render the component", async () => {
    await render(RequestQuoteSuccessComponent, {
      providers: [provideZonelessChangeDetection()],
    });

    const content = await screen.findByTestId("zephyr-success-card-content");

    expect(content).toHaveTextContent(
      "Munkatársunk 3 munkanapon belül felveszi Önnel a kapcsolatot.",
    );

    const mailtoLink = screen.getByRole("link", {
      name: "zephyr.bt@gmail.com",
    });

    expect(mailtoLink).toHaveAttribute("href", "mailto:zephyr.bt@gmail.com");
  });
});
