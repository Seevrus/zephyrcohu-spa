import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideLocationMocks } from "@angular/common/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen } from "@testing-library/angular";

import { testQueryClient } from "../mocks/testQueryClient";
import { AppComponent } from "./app.component";
import { routes } from "./app.routes";

describe("App Component", () => {
  test("should render header and footer", async () => {
    const { container } = await renderAppComponent("/");

    const footer = container.querySelector(".footer-main");
    expect(footer).toBeInTheDocument();

    const header = container.querySelector(".header-main");
    expect(header).toBeInTheDocument();
  });

  test("should render the Main Component initially", async () => {
    await renderAppComponent("/");
    expect(screen.getByTestId("main-component")).toBeInTheDocument();
  });

  test("renders the Login Component", async () => {
    await renderAppComponent("/bejelentkezes");
    expect(screen.getByTestId("login-component")).toBeInTheDocument();
  });

  test("renders the registration form", async () => {
    await renderAppComponent("/regisztracio");
    expect(screen.getByTestId("register-component")).toBeInTheDocument();
  });
});

async function renderAppComponent(initialRoute: string) {
  return render(AppComponent, {
    initialRoute,
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter(routes),
      provideLocationMocks(),
      provideZonelessChangeDetection(),
    ],
  });
}
