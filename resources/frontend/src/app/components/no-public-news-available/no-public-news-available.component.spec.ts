import { render, screen } from "@testing-library/angular";

import { NoPublicNewsAvailableComponent } from "./no-public-news-available.component";

describe("No Public News Available Component", () => {
  test("should render the component", async () => {
    await renderComponent(8);

    expect(screen.getByTestId("no-public-news-available")).toBeInTheDocument();

    expect(
      screen.getByTestId("no-public-news-available-title"),
    ).toHaveTextContent("Jelenleg nincs elérhető nyilvános hírünk.");

    expect(
      screen.getByTestId("no-public-news-available-content").innerHTML,
    ).toBe(
      '<p _ngcontent-a-c485892749=""> Jelenleg nincs elérhető nyilvános hírünk, azonban további 8 hír érhető el regisztrált felhasználóink számára. Kérjük <a _ngcontent-a-c485892749="" routerlink="/bejelentkezes" class="zephyr-link" href="/bejelentkezes">jelentkezzen be</a>, vagy <a _ngcontent-a-c485892749="" routerlink="/regisztracio" class="zephyr-link" href="/regisztracio">regisztráljon honlapunkra</a>! </p>',
    );
  });
});

async function renderComponent(numberOfAdditionalNews: number) {
  await render(NoPublicNewsAvailableComponent, {
    inputs: {
      numberOfAdditionalNews,
    },
  });
}
