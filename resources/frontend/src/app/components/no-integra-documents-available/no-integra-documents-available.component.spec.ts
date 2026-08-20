import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";

import { NoIntegraDocumentsAvailableComponent } from "./no-integra-documents-available.component";

describe("No Integra Documents Available Component", () => {
  test("should render the component", async () => {
    await renderComponent();

    expect(
      screen.getByTestId("no-integra-documents-available"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("no-integra-documents-available-title"),
    ).toHaveTextContent("Ebben a kategóriában még nincs elérhető dokumentum.");

    expect(
      screen.getByTestId("no-integra-documents-available-content"),
    ).toHaveTextContent(
      "Bármilyen felmerülő kérdés esetén kérjük, írjon nekünk a",
    );

    expect(
      screen.getByRole("link", { name: "zephyr.bt@gmail.com" }),
    ).toHaveAttribute("href", "mailto:zephyr.bt@gmail.com");
  });
});

async function renderComponent() {
  await render(NoIntegraDocumentsAvailableComponent, {
    providers: [provideZonelessChangeDetection()],
  });
}
