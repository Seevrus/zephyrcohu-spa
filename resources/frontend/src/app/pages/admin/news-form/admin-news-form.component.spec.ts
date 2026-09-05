import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { provideRouter, Router } from "@angular/router";
import {
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminNewsItemRequest } from "../../../../mocks/admin/news/adminNewsRequest";
import {
  matchCreateAdminNewsRequest,
  matchUpdateAdminNewsRequest,
} from "../../../../mocks/admin/news/createAdminNewsRequest";
import { createGetAdminNewsItemOkResponse } from "../../../../mocks/admin/news/createGetAdminNewsItemOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { queryKeys } from "../../../services/queryKeys";
import { AdminNewsFormComponent } from "./admin-news-form.component";

describe("AdminNewsFormComponent", () => {
  test("renders empty fields in create mode and does not fire a GET", async () => {
    const { httpTesting } = await renderAdminNewsForm();

    expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe("");

    expect(httpTesting.match(matchAdminNewsItemRequest(1))).toHaveLength(0);

    httpTesting.verify();
  });

  test("the submit button is disabled while the form is invalid", async () => {
    await renderAdminNewsForm();

    expect(screen.getByRole("button", { name: "Beküldés" })).toBeDisabled();
  });

  test("renders the datepicker's calendar toggle button", async () => {
    await renderAdminNewsForm();

    expect(
      screen.getByRole("button", { name: "Open calendar" }),
    ).toBeInTheDocument();
  });

  test("submitting a valid form fires POST /admin/news with the exact body and navigates back", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminNewsForm();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    const queryClient = TestBed.inject(QueryClient);
    queryClient.setQueryData(queryKeys.adminNews, []);
    queryClient.setQueryData(queryKeys.news(), []);

    await user.type(screen.getByLabelText("Cím"), "Karbantartás");

    // TinyMCE and the Material datepicker calendar don't render usable
    // controls under jsdom (see rich-text-editor.component.spec.ts) — set
    // their form values directly through the component instance instead.
    fixture.componentInstance.newsForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.newsForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminNewsRequest()),
    );

    expect(request.request.body).toStrictEqual({
      audience: "P",
      title: "Karbantartás",
      mainContent: "<p>Tartalom</p>",
      additionalContent: null,
      publishedAt: "2026-02-10",
    });

    request.flush(createGetAdminNewsItemOkResponse({ id: 9 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirek"]);
    });

    expect(queryClient.getQueryState(queryKeys.adminNews)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(queryKeys.news())?.isInvalidated).toBe(
      true,
    );

    httpTesting.verify();
  });

  test("a 422 response renders the invalid-data message and stays on the page", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminNewsForm();

    await user.type(screen.getByLabelText("Cím"), "Karbantartás");
    fixture.componentInstance.newsForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.newsForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminNewsRequest()),
    );
    request.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByTestId("invalid-data-message"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-news-form-component")).toBeInTheDocument();

    httpTesting.verify();
  });

  test("a 500 response renders the unexpected-error card", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminNewsForm();

    await user.type(screen.getByLabelText("Cím"), "Karbantartás");
    fixture.componentInstance.newsForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.newsForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminNewsRequest()),
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

  test("edit mode fires GET /admin/news/1 and prefills title, audience and date", async () => {
    const { httpTesting, fixture } = await renderAdminNewsForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsItemRequest(1)),
    );
    request.flush(
      createGetAdminNewsItemOkResponse({
        id: 1,
        audience: "A",
        title: "Szerkesztendő hír",
        publishedAt: "2026-03-01T00:00:00.000000Z",
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe(
        "Szerkesztendő hír",
      );
    });

    await expect(
      screen.findByText("Regisztrált felhasználók"),
    ).resolves.toBeInTheDocument();

    expect(
      fixture.componentInstance.newsForm.publishedAt().value(),
    ).toStrictEqual(new Date("2026-03-01T00:00:00.000000Z"));

    httpTesting.verify();
  });

  test("sets the specific page title and breadcrumb once the news item loads in edit mode", async () => {
    const titleSetTitleSpy = vi.spyOn(Title.prototype, "setTitle");
    const breadcrumbSetBreadcrumbSpy = vi.spyOn(
      BreadcrumbService.prototype,
      "setBreadcrumb",
    );

    const { httpTesting } = await renderAdminNewsForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsItemRequest(1)),
    );
    request.flush(
      createGetAdminNewsItemOkResponse({ id: 1, title: "Régi cím" }),
    );

    await waitFor(() => {
      expect(titleSetTitleSpy).toHaveBeenCalledWith("Régi cím - Zephyr Bt.");
    });

    expect(breadcrumbSetBreadcrumbSpy).toHaveBeenCalledWith(
      "Admin - Hír szerkesztése - Régi cím",
    );

    titleSetTitleSpy.mockRestore();
    breadcrumbSetBreadcrumbSpy.mockRestore();

    httpTesting.verify();
  });

  test("edit mode submit fires PUT /admin/news/1 and navigates back", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminNewsForm("1");

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    const getRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsItemRequest(1)),
    );
    getRequest.flush(
      createGetAdminNewsItemOkResponse({ id: 1, title: "Régi cím" }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe(
        "Régi cím",
      );
    });

    await user.click(screen.getByRole("button", { name: "Hír módosítása" }));

    const putRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminNewsRequest(1)),
    );
    putRequest.flush(createGetAdminNewsItemOkResponse({ id: 1 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirek"]);
    });

    // The update invalidates `adminNewsItem(1)`, and this component's own
    // item query is still an active observer for that key, so it refetches.
    const refetchRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsItemRequest(1)),
    );
    refetchRequest.flush(createGetAdminNewsItemOkResponse({ id: 1 }));

    httpTesting.verify();
  });

  test("edit mode with a 404 GET renders the unexpected-error card", async () => {
    const { httpTesting } = await renderAdminNewsForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsItemRequest(1)),
    );
    request.flush(
      { status: 404, code: "GENERIC_NOT_FOUND" },
      { status: 404, statusText: "Not Found" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("a non-numeric route id redirects to the news grid without firing a GET", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderAdminNewsForm("ujjjj");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirek"], {
        replaceUrl: true,
      });
    });

    navigateSpy.mockRestore();

    expect(
      httpTesting.match(matchAdminNewsItemRequest(Number.NaN)),
    ).toHaveLength(0);

    httpTesting.verify();
  });
});

async function renderAdminNewsForm(id?: string) {
  const renderResult = await render(AdminNewsFormComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/hirek", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
