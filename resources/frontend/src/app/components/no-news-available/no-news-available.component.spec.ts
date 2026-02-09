import { render, screen } from "@testing-library/angular";

import { NoNewsAvailableComponent } from "./no-news-available.component";

describe("No News Available Component", () => {
  test("should render the component", async () => {
    await renderComponent();

    expect(screen.getByTestId("no-news-available")).toBeInTheDocument();

    expect(screen.getByTestId("no-news-available-title")).toHaveTextContent(
      "Jelenleg nincs elérhető hír.",
    );

    expect(screen.getByTestId("no-news-available-content").innerHTML).toBe(
      '<p _ngcontent-a-c1866295901=""> Kérjük, látogasson el később az oldalunkra, vagy vegye fel velünk a kapcsolatot. </p><p _ngcontent-a-c1866295901=""> Írjon nekünk a <a _ngcontent-a-c1866295901="" class="zephyr-link" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>',
    );
  });
});

async function renderComponent() {
  await render(NoNewsAvailableComponent);
}
