import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";

import { NoPublicOffersAvailableComponent } from "./no-public-offers-available.component";

describe("No Public Offers Available Component", () => {
  test("should render the component", async () => {
    await renderComponent(8);

    expect(
      screen.getByTestId("no-public-offers-available"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("no-public-offers-available-title"),
    ).toHaveTextContent("Jelenleg nincs elérhető nyilvános ajánlatunk.");

    expect(
      screen.getByTestId("no-public-offers-available-content"),
    ).toHaveTextContent(
      "Jelenleg nincs elérhető nyilvános ajánlatunk, azonban további 8 ajánlat érhető el regisztrált felhasználóink számára. Kérjük jelentkezzen be, vagy regisztráljon honlapunkra!",
    );

    expect(
      screen.getByRole("link", { name: "jelentkezzen be" }),
    ).toHaveAttribute("href", "/bejelentkezes");

    expect(
      screen.getByRole("link", { name: "regisztráljon honlapunkra" }),
    ).toHaveAttribute("href", "/regisztracio");
  });
});

async function renderComponent(numberOfAdditionalOffers: number) {
  await render(NoPublicOffersAvailableComponent, {
    inputs: {
      numberOfAdditionalOffers,
    },
    providers: [provideZonelessChangeDetection()],
  });
}
