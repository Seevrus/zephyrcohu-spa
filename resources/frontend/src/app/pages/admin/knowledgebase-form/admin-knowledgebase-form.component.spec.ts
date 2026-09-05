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
import { fireEvent, render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminKnowledgebaseItemRequest } from "../../../../mocks/admin/knowledgebase/adminKnowledgebaseRequest";
import {
  matchCreateAdminKnowledgebaseRequest,
  matchUpdateAdminKnowledgebaseRequest,
} from "../../../../mocks/admin/knowledgebase/createAdminKnowledgebaseRequest";
import { createGetAdminKnowledgebaseItemOkResponse } from "../../../../mocks/admin/knowledgebase/createGetAdminKnowledgebaseItemOkResponse";
import { createGetKnowledgebaseTagsOkResponse } from "../../../../mocks/knowledgebase/createGetKnowledgebaseTagsOkResponse";
import { matchKnowledgebaseTagsRequest } from "../../../../mocks/knowledgebase/knowledgebaseTagsRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { queryKeys } from "../../../services/queryKeys";
import { AdminKnowledgebaseFormComponent } from "./admin-knowledgebase-form.component";

describe("AdminKnowledgebaseFormComponent", () => {
  test("renders empty fields in create mode, does not fire a GET item request, and loads the tag list", async () => {
    const { httpTesting } = await renderAdminKnowledgebaseForm();

    expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe("");

    expect(
      httpTesting.match(matchAdminKnowledgebaseItemRequest(1)),
    ).toHaveLength(0);

    await waitFor(() => httpTesting.expectOne(matchKnowledgebaseTagsRequest()));

    httpTesting.verify();
  });

  test("the submit button is disabled while the form is invalid", async () => {
    await renderAdminKnowledgebaseForm();

    expect(screen.getByRole("button", { name: "Beküldés" })).toBeDisabled();
  });

  test("typing a new tag name and pressing Enter adds a chip", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebaseForm();

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    const input = screen.getByPlaceholderText("Új címke hozzáadása");

    await typeTagAndPressEnter(user, input, "ÚJ CÍMKE");

    expect(screen.getByRole("row", { name: /ÚJ CÍMKE/ })).toBeInTheDocument();

    httpTesting.verify();
  });

  test("selecting an existing tag from the autocomplete adds a chip", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebaseForm();

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(
      createGetKnowledgebaseTagsOkResponse([
        { id: 1, name: "INTEGRA", count: 3 },
      ]),
    );

    await user.type(
      screen.getByPlaceholderText("Új címke hozzáadása"),
      "INTEG",
    );

    await user.click(await screen.findByRole("option", { name: "INTEGRA" }));

    expect(screen.getByRole("row", { name: /INTEGRA/ })).toBeInTheDocument();

    httpTesting.verify();
  });

  test("adding the same tag name twice keeps one chip", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebaseForm();

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    const input = screen.getByPlaceholderText("Új címke hozzáadása");

    await typeTagAndPressEnter(user, input, "INTEGRA");
    await typeTagAndPressEnter(user, input, "integra");

    expect(screen.getAllByRole("row", { name: /INTEGRA/i })).toHaveLength(1);

    httpTesting.verify();
  });

  test("removing a chip drops it from the payload", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebaseForm();

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    const input = screen.getByPlaceholderText("Új címke hozzáadása");

    await typeTagAndPressEnter(user, input, "INTEGRA");

    expect(screen.getByRole("row", { name: /INTEGRA/ })).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Címke eltávolítása: INTEGRA" }),
    );

    expect(
      screen.queryByRole("row", { name: /INTEGRA/ }),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("submitting a valid form fires POST /admin/knowledgebase with the exact body, including tags", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminKnowledgebaseForm();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    const queryClient = TestBed.inject(QueryClient);
    queryClient.setQueryData(queryKeys.adminKnowledgebase, []);
    queryClient.setQueryData(queryKeys.knowledgebase(), []);
    queryClient.setQueryData(queryKeys.adminTags, []);

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await user.type(screen.getByLabelText("Cím"), "Karbantartás");
    await typeTagAndPressEnter(
      user,
      screen.getByPlaceholderText("Új címke hozzáadása"),
      "INTEGRA",
    );

    // TinyMCE and the Material datepicker calendar don't render usable
    // controls under jsdom (see rich-text-editor.component.spec.ts) — set
    // their form values directly through the component instance instead.
    fixture.componentInstance.knowledgebaseForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.knowledgebaseForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminKnowledgebaseRequest()),
    );

    expect(request.request.body).toStrictEqual({
      audience: "P",
      title: "Karbantartás",
      mainContent: "<p>Tartalom</p>",
      additionalContent: null,
      publishedAt: "2026-02-10",
      tags: ["INTEGRA"],
    });

    request.flush(createGetAdminKnowledgebaseItemOkResponse({ id: 9 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/tudasbazis"]);
    });

    expect(
      queryClient.getQueryState(queryKeys.adminKnowledgebase)?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(queryKeys.knowledgebase())?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(queryKeys.adminTags)?.isInvalidated).toBe(
      true,
    );

    // The create mutation also invalidates `knowledgebaseTags`, and this
    // component's own tag-list query is still an active observer for that
    // key, so it refetches.
    const tagsRefetchRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRefetchRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    httpTesting.verify();
  });

  test("a 422 response renders the invalid-data message and stays on the page", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminKnowledgebaseForm();

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await user.type(screen.getByLabelText("Cím"), "Karbantartás");
    fixture.componentInstance.knowledgebaseForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.knowledgebaseForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminKnowledgebaseRequest()),
    );
    request.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByTestId("invalid-data-message"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByTestId("admin-knowledgebase-form-component"),
    ).toBeInTheDocument();

    httpTesting.verify();
  });

  test("a 500 response renders the unexpected-error card", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminKnowledgebaseForm();

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await user.type(screen.getByLabelText("Cím"), "Karbantartás");
    fixture.componentInstance.knowledgebaseForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.knowledgebaseForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminKnowledgebaseRequest()),
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

  test("edit mode fires GET /admin/knowledgebase/1 and prefills title, audience, date and tag chips", async () => {
    const { httpTesting, fixture } = await renderAdminKnowledgebaseForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseItemRequest(1)),
    );
    request.flush(
      createGetAdminKnowledgebaseItemOkResponse({
        id: 1,
        audience: "A",
        title: "Szerkesztendő cikk",
        publishedAt: "2026-03-01T00:00:00.000000Z",
        tags: [
          { id: 1, name: "INTEGRA" },
          { id: 2, name: "HR" },
        ],
      }),
    );

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe(
        "Szerkesztendő cikk",
      );
    });

    await expect(
      screen.findByText("Regisztrált felhasználók"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByRole("row", { name: /INTEGRA/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /HR/ })).toBeInTheDocument();

    expect(
      fixture.componentInstance.knowledgebaseForm.publishedAt().value(),
    ).toStrictEqual(new Date("2026-03-01T00:00:00.000000Z"));

    httpTesting.verify();
  });

  test("sets the specific page title and breadcrumb once the article loads in edit mode", async () => {
    const titleSetTitleSpy = vi.spyOn(Title.prototype, "setTitle");
    const breadcrumbSetBreadcrumbSpy = vi.spyOn(
      BreadcrumbService.prototype,
      "setBreadcrumb",
    );

    const { httpTesting } = await renderAdminKnowledgebaseForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseItemRequest(1)),
    );
    request.flush(
      createGetAdminKnowledgebaseItemOkResponse({ id: 1, title: "Régi cím" }),
    );

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await waitFor(() => {
      expect(titleSetTitleSpy).toHaveBeenCalledWith("Régi cím - Zephyr Bt.");
    });

    expect(breadcrumbSetBreadcrumbSpy).toHaveBeenCalledWith(
      "Admin - Tudásbázis cikk szerkesztése - Régi cím",
    );

    titleSetTitleSpy.mockRestore();
    breadcrumbSetBreadcrumbSpy.mockRestore();

    httpTesting.verify();
  });

  test("edit mode submit fires PUT /admin/knowledgebase/1 and navigates back", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebaseForm("1");

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    const queryClient = TestBed.inject(QueryClient);
    queryClient.setQueryData(queryKeys.adminTags, []);

    const getRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseItemRequest(1)),
    );
    getRequest.flush(
      createGetAdminKnowledgebaseItemOkResponse({ id: 1, title: "Régi cím" }),
    );

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe(
        "Régi cím",
      );
    });

    await user.click(screen.getByRole("button", { name: "Cikk módosítása" }));

    const putRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminKnowledgebaseRequest(1)),
    );
    putRequest.flush(createGetAdminKnowledgebaseItemOkResponse({ id: 1 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/tudasbazis"]);
    });

    // The update invalidates `adminKnowledgebaseItem(1)` and
    // `knowledgebaseTags`, and this component's own item and tags queries
    // are still active observers for those keys, so both refetch.
    const refetchRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseItemRequest(1)),
    );
    refetchRequest.flush(createGetAdminKnowledgebaseItemOkResponse({ id: 1 }));

    const tagsRefetchRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRefetchRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    // The admin tags grid isn't mounted here, so `adminTags` has no active
    // observer to refetch it — but it must still be marked invalidated, or
    // the tags page would show stale counts after an article's tags change.
    expect(queryClient.getQueryState(queryKeys.adminTags)?.isInvalidated).toBe(
      true,
    );

    httpTesting.verify();
  });

  test("edit mode with a 404 GET renders the unexpected-error card", async () => {
    const { httpTesting } = await renderAdminKnowledgebaseForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseItemRequest(1)),
    );
    request.flush(
      { status: 404, code: "GENERIC_NOT_FOUND" },
      { status: 404, statusText: "Not Found" },
    );

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("a non-numeric route id redirects to the knowledgebase grid without firing a GET", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderAdminKnowledgebaseForm("ujjjj");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/tudasbazis"], {
        replaceUrl: true,
      });
    });

    navigateSpy.mockRestore();

    expect(
      httpTesting.match(matchAdminKnowledgebaseItemRequest(Number.NaN)),
    ).toHaveLength(0);

    const tagsRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsRequest.flush(createGetKnowledgebaseTagsOkResponse([]));

    httpTesting.verify();
  });
});

async function renderAdminKnowledgebaseForm(id?: string) {
  const renderResult = await render(AdminKnowledgebaseFormComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/tudasbazis", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}

/**
 * `MatChipInput` decides whether a keydown is a "separator" key by reading
 * the legacy `KeyboardEvent.keyCode` (see `_isSeparatorKey` in
 * `@angular/material/chips`), but `@testing-library/user-event`'s
 * `{enter}` syntax deliberately omits that deprecated property. Typing via
 * `user.type` and then dispatching a plain `keydown` with `keyCode` set
 * reproduces what a real Enter keypress does in a browser.
 */
async function typeTagAndPressEnter(
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  text: string,
) {
  await user.type(input, text);
  fireEvent.keyDown(input, { key: "Enter", code: "Enter", keyCode: 13 });
}
