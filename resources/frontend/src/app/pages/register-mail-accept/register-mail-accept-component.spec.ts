import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";

import { testQueryClient } from "../../../mocks/testQueryClient";
import { confirmEmailRequest } from "../../../mocks/users/confirmEmailRequest";
import { createConfirmEmailErrorResponse } from "../../../mocks/users/createConfirmEmailErrorResponse";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { routes } from "../../app.routes";
import { RegisterMailAcceptComponent } from "./register-mail-accept.component";

const TEST_EMAIL = "abc@example.com";
const TEST_CODE = "1234567890";

describe("Register Email, Accept Registration", () => {
  test("initial state", async () => {
    await renderComponent(TEST_EMAIL, TEST_CODE);

    expect(screen.getByTestId("confirm-in-progress")).toHaveTextContent(
      "Regisztrációs email ellenőrzése folyamatban...",
    );
  });

  describe("confirm errors", () => {
    const expectedMessage =
      '<p> A megadott link hibás. Kérjük, ellenőrizze, jól másolta-e be a böngészőjébe. Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p><p> Regisztrációhoz kérjük <a routerlink="/regisztracio" class="zephyr-link" href="/regisztracio">kattintson ide</a>. </p><!--container--><!--container--><!--container-->';

    test("bad query parameters", async () => {
      const { httpTesting } = await renderComponent(undefined, TEST_CODE);

      expect(
        (await screen.findByTestId("confirm-error-message")).innerHTML,
      ).toEqual(expectedMessage);

      httpTesting.verify();
    });

    test("bad email code", async () => {
      const { httpTesting } = await renderComponent(TEST_EMAIL, "abc");

      const request = await waitFor(() =>
        httpTesting.expectOne(confirmEmailRequest),
      );

      request.flush(createConfirmEmailErrorResponse("BAD_EMAIL_CODE"), {
        status: 404,
        statusText: "Not Found",
      });

      expect(
        (await screen.findByTestId("confirm-error-message")).innerHTML,
      ).toEqual(expectedMessage);

      httpTesting.verify();
    });

    test("invalid request data", async () => {
      const { httpTesting } = await renderComponent("abc", "abc");

      const request = await waitFor(() =>
        httpTesting.expectOne(confirmEmailRequest),
      );

      request.flush(createConfirmEmailErrorResponse("INVALID_REQUEST_DATA"), {
        status: 422,
        statusText: "Unprocessable Content",
      });

      expect(
        (await screen.findByTestId("confirm-error-message")).innerHTML,
      ).toEqual(expectedMessage);

      httpTesting.verify();
    });

    test("user already confirmed", async () => {
      const { httpTesting } = await renderComponent(TEST_EMAIL, TEST_CODE);

      const request = await waitFor(() =>
        httpTesting.expectOne(confirmEmailRequest),
      );

      request.flush(createConfirmEmailErrorResponse("USER_ALREADY_CONFIRMED"), {
        status: 410,
        statusText: "Gone",
      });

      expect(
        (await screen.findByTestId("confirm-error-message")).innerHTML,
      ).toEqual(
        '<!--container--><p> Ezt a felhasználót már aktiválták. Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p><p> Bejelentkezéshez kérjük <a routerlink="/bejelentkezes" class="zephyr-link" href="/bejelentkezes">kattintson ide</a>. </p><!--container--><!--container-->',
      );

      httpTesting.verify();
    });

    test("unexpected error", async () => {
      const { httpTesting } = await renderComponent(TEST_EMAIL, TEST_CODE);

      const request = await waitFor(() =>
        httpTesting.expectOne(confirmEmailRequest),
      );

      request.flush(createConfirmEmailErrorResponse("INTERNAL_SERVER_ERROR"), {
        status: 500,
        statusText: "Internal Server Error",
      });

      expect(
        (await screen.findByTestId("confirm-error-message")).innerHTML,
      ).toEqual(
        '<!--container--><!--container--><p> Váratlan hiba képett fel az email cím megerősítése során. Kérjük, írjon nekünk a <a class="zephyr-link" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p><p> Regisztrációhoz kérjük <a routerlink="/regisztracio" class="zephyr-link" href="/regisztracio">kattintson ide</a>. </p><!--container-->',
      );

      httpTesting.verify();
    });
  });

  test("successful confirm", async () => {
    const { httpTesting } = await renderComponent(TEST_EMAIL, TEST_CODE);

    const request = await waitFor(() =>
      httpTesting.expectOne(confirmEmailRequest),
    );

    request.flush(getSessionOkResponse);

    expect(
      (await screen.findByTestId("confirm-success-message")).innerHTML,
    ).toEqual(
      '<p>A(z) abc@example.com e-mail címmel és a hozzá tartozó jelszó segítségével mostantól be tud jelentkezni a honlapunkon.</p><p>Bejelentkezéshez kérjük <a routerlink="/bejelentkezes" class="zephyr-link" href="/bejelentkezes">kattintson ide</a>.</p>',
    );

    httpTesting.verify();
  });
});

async function renderComponent(
  email: string | undefined,
  code: string | undefined,
) {
  const queryParams = new URLSearchParams();
  if (email) {
    queryParams.append("email", email);
  }
  if (code) {
    queryParams.append("code", code);
  }

  const renderResult = await render(RegisterMailAcceptComponent, {
    initialRoute: `/regisztracio/megerosit?${queryParams.toString()}`,
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter(routes),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
