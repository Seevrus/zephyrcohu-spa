import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";

import { AdminHomeComponent } from "./admin-home.component";

describe("AdminHomeComponent", () => {
  test("renders the admin landing copy", async () => {
    await render(AdminHomeComponent, {
      providers: [provideZonelessChangeDetection()],
    });

    const component = screen.getByTestId("admin-home-component");

    expect(component).toBeInTheDocument();
    expect(component).toHaveTextContent(
      "Ez az admin felület. Kérlek, ne felejts el kijelentkezni.",
    );
  });
});
