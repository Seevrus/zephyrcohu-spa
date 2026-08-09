import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";

import { AdditionalOffersAvailableComponent } from "./additional-offers-available.component";

describe("Additional Offers Available Component", () => {
  test("should render the component", async () => {
    await renderComponent(10);

    expect(
      screen.getByTestId("additional-offers-available"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("additional-offers-available-title"),
    ).toHaveTextContent("További ajánlataink is elérhetőek!");

    expect(
      screen.getByTestId("additional-offers-available-content"),
    ).toHaveTextContent(
      "Regisztrált felhasználóink számára további 10 ajánlat érhető el. Kérjük jelentkezzen be, vagy regisztráljon honlapunkra!",
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
  await render(AdditionalOffersAvailableComponent, {
    inputs: {
      numberOfAdditionalOffers,
    },
    providers: [provideZonelessChangeDetection()],
  });
}
