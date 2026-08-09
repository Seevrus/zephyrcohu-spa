import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";

import { NoOffersAvailableComponent } from "./no-offers-available.component";

describe("No Offers Available Component", () => {
  test("should render the component", async () => {
    await renderComponent();

    expect(screen.getByTestId("no-offers-available")).toBeInTheDocument();

    expect(screen.getByTestId("no-offers-available-title")).toHaveTextContent(
      "Jelenleg nincs elérhető ajánlat.",
    );

    expect(screen.getByTestId("no-offers-available-content")).toHaveTextContent(
      "Kérjük, látogasson el később az oldalunkra, vagy vegye fel velünk a kapcsolatot.",
    );

    expect(
      screen.getByRole("link", { name: "zephyr.bt@gmail.com" }),
    ).toHaveAttribute("href", "mailto:zephyr.bt@gmail.com");
  });
});

async function renderComponent() {
  await render(NoOffersAvailableComponent, {
    providers: [provideZonelessChangeDetection()],
  });
}
