import { render, screen } from "@testing-library/angular";

import { AdditionalNewsAvailableComponent } from "./additional-news-available.component";

describe("Additional News Available Component", () => {
  test("should render the component", async () => {
    await renderComponent(10);

    expect(screen.getByTestId("additional-news-available")).toBeInTheDocument();

    expect(
      screen.getByTestId("additional-news-available-title"),
    ).toHaveTextContent("További híreink is elérhetőek!");

    expect(
      screen.getByTestId("additional-news-available-content").innerHTML,
    ).toBe(
      '<p _ngcontent-a-c1754253665=""> Regisztrált felhasználóink számára további 10 hír érhető el. Kérjük <a _ngcontent-a-c1754253665="" routerlink="/bejelentkezes" class="zephyr-link" href="/bejelentkezes">jelentkezzen be</a>, vagy <a _ngcontent-a-c1754253665="" routerlink="/regisztracio" class="zephyr-link" href="/regisztracio">regisztráljon honlapunkra</a>! </p>',
    );
  });
});

async function renderComponent(numberOfAdditionalNews: number) {
  await render(AdditionalNewsAvailableComponent, {
    inputs: {
      numberOfAdditionalNews,
    },
  });
}
