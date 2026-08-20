import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import requestOfferErrorResponse from "../../../mocks/offers/requestOfferErrorResponse.json";
import { requestOfferRequest } from "../../../mocks/offers/requestOfferRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { RequestQuoteComponent } from "./request-quote.component";

describe("Request Quote Component", () => {
  const user = userEvent.setup();

  describe("should render the form correctly", () => {
    test("labels", async () => {
      await renderRequestQuoteComponent();

      expect(
        screen.getByTestId("name").querySelector("label"),
      ).toHaveTextContent("Név");
      expect(
        screen.getByTestId("email").querySelector("label"),
      ).toHaveTextContent("Email cím");
      expect(
        screen.getByTestId("subject").querySelector("label"),
      ).toHaveTextContent("Árajánlatkérés tárgya");
      expect(
        screen.getByTestId("message").querySelector("label"),
      ).toHaveTextContent("További információk");
    });

    test("submit button", async () => {
      await renderRequestQuoteComponent();

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();
    });
  });

  describe("should validate the form correctly", () => {
    test("required fields", async () => {
      const { container } = await renderRequestQuoteComponent();

      const nameInput = screen.getByTestId("name").querySelector("input")!;

      await user.click(nameInput);
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("email format", async () => {
      await renderRequestQuoteComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;

      await user.type(emailInput, "invalid-email");
      await user.tab();

      expect(
        screen.getByTestId("email").querySelector("mat-error"),
      ).toHaveTextContent("Email cím formátuma nem megfelelő");
    });

    test("can submit if the form is valid", async () => {
      const { fixture } = await renderRequestQuoteComponent();

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();

      await fillForm(user);

      await fixture.whenStable();

      expect(submitButton).toBeEnabled();
    });
  });

  test("should show the correct API error message in the case of an unknown error", async () => {
    const { httpTesting } = await renderRequestQuoteComponent();
    await fillForm(user);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const request = await waitFor(() =>
      httpTesting.expectOne(requestOfferRequest),
    );

    request.flush(requestOfferErrorResponse, {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("request-quote-success"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("should show the correct API success message", async () => {
    const { httpTesting } = await renderRequestQuoteComponent();
    await fillForm(user);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const request = await waitFor(() =>
      httpTesting.expectOne(requestOfferRequest),
    );

    request.flush(null);

    await expect(
      screen.findByTestId("request-quote-success"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("form-unexpected-error"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId("name").querySelector("input")!, "Teszt Elek");
  await user.type(
    screen.getByTestId("email").querySelector("input")!,
    "teszt@example.com",
  );

  await user.click(screen.getByTestId("subject").querySelector("mat-select")!);
  await user.click(
    await screen.findByText("Zephyr INTEGRA - új ügyfél, cégügyvitel"),
  );

  await user.type(
    screen.getByTestId("message").querySelector("textarea")!,
    "Kérem hívjanak vissza.",
  );
}

async function renderRequestQuoteComponent() {
  const renderResult = await render(RequestQuoteComponent, {
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
