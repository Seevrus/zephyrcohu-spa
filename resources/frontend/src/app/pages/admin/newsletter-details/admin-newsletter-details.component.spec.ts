import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";

import { matchAdminNewsletterItemRequest } from "../../../../mocks/admin/newsletters/adminNewslettersRequest";
import { createGetAdminNewsletterItemOkResponse } from "../../../../mocks/admin/newsletters/createGetAdminNewsletterItemOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { type AdminNewsletterResponseItem } from "../../../../types/admin-newsletters";
import { AdminNewsletterDetailsComponent } from "./admin-newsletter-details.component";

describe("AdminNewsletterDetailsComponent", () => {
  test("renders the subject, the date, the counters and the content", async () => {
    const { httpTesting, container } = await renderAdminNewsletterDetails();

    await flushNewsletter(httpTesting, {
      subject: "Zephyr hírlevél 2026 február",
      createdAt: "2026-02-10T00:00:00.000000Z",
      content: "<p>Kedves <strong>Partnerünk</strong>!</p>",
      sentCount: 118,
      recipientCount: 120,
    });

    await expect(
      screen.findByRole("heading", { name: "Zephyr hírlevél 2026 február" }),
    ).resolves.toBeInTheDocument();

    expect(container.textContent).toContain("2026. február 10.");
    expect(screen.getByTestId("newsletter-progress").textContent).toContain(
      "118 / 120",
    );

    expect(screen.getByTestId("newsletter-content").innerHTML).toContain(
      "<strong>Partnerünk</strong>",
    );

    httpTesting.verify();
  });

  test("offers the resume action while the send is unfinished", async () => {
    const { httpTesting } = await renderAdminNewsletterDetails();

    await flushNewsletter(httpTesting, { isSentToEveryone: false });

    await expect(
      screen.findByRole("link", { name: "Kiküldés folytatása" }),
    ).resolves.toHaveAttribute("href", "/admin/hirlevel/1/kuldes");

    expect(
      screen.queryByText("A hírlevél minden címzettnek kiküldésre került."),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("reports a finished send instead of the resume action", async () => {
    const { httpTesting } = await renderAdminNewsletterDetails();

    await flushNewsletter(httpTesting, {
      sentCount: 120,
      recipientCount: 120,
      isSentToEveryone: true,
    });

    await expect(
      screen.findByText("A hírlevél minden címzettnek kiküldésre került."),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Kiküldés folytatása" }),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows a not-found message for an unknown newsletter", async () => {
    const { httpTesting } = await renderAdminNewsletterDetails();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsletterItemRequest(1)),
    );
    request.flush(
      { status: 404, code: "GENERIC_NOT_FOUND" },
      { status: 404, statusText: "Not Found" },
    );

    await expect(
      screen.findByTestId("newsletter-not-found"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminNewsletterDetails();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsletterItemRequest(1)),
    );
    request.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("redirects to the list when the id is not a number", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderAdminNewsletterDetails("abc");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirlevel"], {
        replaceUrl: true,
      });
    });

    httpTesting.verify();
  });
});

async function flushNewsletter(
  httpTesting: HttpTestingController,
  overrides: Partial<AdminNewsletterResponseItem> = {},
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminNewsletterItemRequest(1)),
  );

  request.flush(createGetAdminNewsletterItemOkResponse(overrides));
}

async function renderAdminNewsletterDetails(id = "1") {
  const renderResult = await render(AdminNewsletterDetailsComponent, {
    inputs: { id },
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
