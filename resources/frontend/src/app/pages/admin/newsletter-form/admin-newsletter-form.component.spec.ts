import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import {
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchCreateAdminNewsletterRequest } from "../../../../mocks/admin/newsletters/adminNewslettersRequest";
import { createGetAdminNewsletterItemOkResponse } from "../../../../mocks/admin/newsletters/createGetAdminNewsletterItemOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { queryKeys } from "../../../services/queryKeys";
import { AdminNewsletterFormComponent } from "./admin-newsletter-form.component";

describe("AdminNewsletterFormComponent", () => {
  const user = userEvent.setup();

  test("keeps the submit button disabled until both the subject and the body are filled", async () => {
    const { httpTesting, fixture } = await renderAdminNewsletterForm();

    const submitButton = await screen.findByRole("button", {
      name: "Elküldés",
    });

    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Tárgy"), "Zephyr hírlevél");

    expect(submitButton).toBeDisabled();

    // TinyMCE doesn't render usable controls under jsdom --> set the form value directly.
    fixture.componentInstance.newsletterForm
      .content()
      .value.set("<p>Kedves Partnerünk!</p>");

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    httpTesting.verify();
  });

  test("creates the newsletter and continues to its sending screen", async () => {
    const { httpTesting, fixture } = await renderAdminNewsletterForm();
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate");
    const queryClient = TestBed.inject(QueryClient);
    queryClient.setQueryData(queryKeys.adminNewsletters, []);

    await fillAndSubmit(fixture);

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminNewsletterRequest()),
    );

    expect(request.request.body).toStrictEqual({
      subject: "Zephyr hírlevél",
      content: "<p>Kedves Partnerünk!</p>",
    });

    request.flush(createGetAdminNewsletterItemOkResponse({ id: 9 }), {
      status: 201,
      statusText: "Created",
    });

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith([
        "/admin/hirlevel",
        9,
        "kuldes",
      ]);
    });

    expect(
      queryClient.getQueryState(queryKeys.adminNewsletters)?.isInvalidated,
    ).toBe(true);

    httpTesting.verify();
  });

  test("shows the invalid-data message when the API rejects the newsletter", async () => {
    const { httpTesting, fixture } = await renderAdminNewsletterForm();

    await fillAndSubmit(fixture);

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminNewsletterRequest()),
    );
    request.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByTestId("invalid-data-message"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("keeps the newsletter filled in when the creation fails", async () => {
    const { httpTesting, fixture } = await renderAdminNewsletterForm();

    await fillAndSubmit(fixture);

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminNewsletterRequest()),
    );
    request.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByLabelText("Tárgy")).toHaveValue("Zephyr hírlevél");
    expect(fixture.componentInstance.newsletterForm.content().value()).toBe(
      "<p>Kedves Partnerünk!</p>",
    );

    httpTesting.verify();
  });

  test("links back to the newsletter list", async () => {
    const { httpTesting } = await renderAdminNewsletterForm();

    await expect(
      screen.findByRole("link", { name: "Mégsem" }),
    ).resolves.toHaveAttribute("href", "/admin/hirlevel");

    httpTesting.verify();
  });
});

async function fillAndSubmit(
  fixture: Awaited<ReturnType<typeof renderAdminNewsletterForm>>["fixture"],
) {
  const user = userEvent.setup();

  await user.type(await screen.findByLabelText("Tárgy"), "Zephyr hírlevél");
  fixture.componentInstance.newsletterForm
    .content()
    .value.set("<p>Kedves Partnerünk!</p>");

  await user.click(screen.getByRole("button", { name: "Elküldés" }));
}

async function renderAdminNewsletterForm() {
  const renderResult = await render(AdminNewsletterFormComponent, {
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        { path: "admin/hirlevel", children: [] },
        { path: "admin/hirlevel/:id/kuldes", children: [] },
      ]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
