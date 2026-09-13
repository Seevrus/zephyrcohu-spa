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
import { userEvent } from "@testing-library/user-event";

import { matchAdminNewslettersRequest } from "../../../../mocks/admin/newsletters/adminNewslettersRequest";
import { createGetAdminNewslettersOkResponse } from "../../../../mocks/admin/newsletters/createGetAdminNewslettersOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminNewslettersComponent } from "./admin-newsletters.component";

describe("AdminNewslettersComponent", () => {
  const user = userEvent.setup();

  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminNewsletters();

    await waitFor(() => httpTesting.expectOne(matchAdminNewslettersRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every newsletter with its date, subject and send progress", async () => {
    const { httpTesting, container } = await renderAdminNewsletters();

    await flushNewsletters(httpTesting, [
      {
        id: 1,
        subject: "Zephyr hírlevél 2026 február",
        createdAt: "2026-02-10T00:00:00.000000Z",
        recipientCount: 120,
        sentCount: 118,
        isSentToEveryone: false,
      },
      {
        id: 2,
        subject: "Zephyr hírlevél 2026 január",
        createdAt: "2026-01-08T00:00:00.000000Z",
        recipientCount: 115,
        sentCount: 115,
        isSentToEveryone: true,
      },
    ]);

    await expect(screen.findByText("118 / 120")).resolves.toBeInTheDocument();

    expect(container.textContent).toContain("Zephyr hírlevél 2026 február");
    expect(container.textContent).toContain("2026. február 10.");
    expect(container.textContent).toContain("Zephyr hírlevél 2026 január");
    expect(container.textContent).toContain("Kiküldve");

    expect(
      screen.getByRole("progressbar", { name: "Kiküldés: 118 / 120" }),
    ).toBeInTheDocument();

    httpTesting.verify();
  });

  test("links to the compose page", async () => {
    const { httpTesting } = await renderAdminNewsletters();

    await flushNewsletters(httpTesting);

    await expect(
      screen.findByRole("link", { name: "Új hírlevél írása" }),
    ).resolves.toHaveAttribute("href", "/admin/hirlevel/uj");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminNewsletters();

    await flushNewsletters(httpTesting, []);

    await expect(
      screen.findByText("Még egyetlen hírlevél sem került elküldésre."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminNewsletters();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewslettersRequest()),
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

  test("clicking the details action navigates to the newsletter view", async () => {
    const { httpTesting } = await renderAdminNewsletters();

    await flushNewsletters(httpTesting, [
      { id: 1, subject: "Zephyr hírlevél 2026 február" },
    ]);

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Részletek: Zephyr hírlevél 2026 február",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirlevel", 1]);

    httpTesting.verify();
  });
});

async function flushNewsletters(
  httpTesting: HttpTestingController,
  data?: Parameters<typeof createGetAdminNewslettersOkResponse>[0],
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminNewslettersRequest()),
  );

  request.flush(createGetAdminNewslettersOkResponse(data));
}

async function renderAdminNewsletters() {
  const renderResult = await render(AdminNewslettersComponent, {
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        { path: "admin/hirlevel/uj", children: [] },
        { path: "admin/hirlevel/:id", children: [] },
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
