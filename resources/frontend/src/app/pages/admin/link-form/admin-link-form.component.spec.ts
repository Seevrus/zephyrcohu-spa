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
import { render, screen, waitFor, within } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminLinkCategoriesRequest } from "../../../../mocks/admin/links/adminLinkCategoriesRequest";
import { matchAdminLinkItemRequest } from "../../../../mocks/admin/links/adminLinksRequest";
import { createGetAdminLinkCategoriesOkResponse } from "../../../../mocks/admin/links/createGetAdminLinkCategoriesOkResponse";
import { createGetAdminLinkItemOkResponse } from "../../../../mocks/admin/links/createGetAdminLinkItemOkResponse";
import {
  matchCreateAdminLinkRequest,
  matchUpdateAdminLinkRequest,
} from "../../../../mocks/admin/links/saveAdminLinkRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { queryKeys } from "../../../services/queryKeys";
import { AdminLinkFormComponent } from "./admin-link-form.component";

describe("AdminLinkFormComponent", () => {
  const user = userEvent.setup();

  test("loads the categories and lists them in the select, with Egyéb (nincs kategória) first", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    request.flush(
      createGetAdminLinkCategoriesOkResponse([
        { id: 1, name: "Community" },
        { id: 2, name: "Documentation" },
      ]),
    );

    await user.click(screen.getByLabelText("Kategória"));

    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    expect(options.map((option) => option.textContent?.trim())).toStrictEqual([
      "Egyéb (nincs kategória)",
      "Community",
      "Documentation",
      "+ Új kategória",
    ]);

    httpTesting.verify();
  });

  test("submitting with an existing category sends categoryName equal to that category's name", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(
      createGetAdminLinkCategoriesOkResponse([{ id: 1, name: "Community" }]),
    );

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(await screen.findByRole("option", { name: "Community" }));

    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Fórum");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://forum.example.com",
    );

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminLinkRequest()),
    );

    expect(request.request.body).toStrictEqual({
      title: "Fórum",
      url: "https://forum.example.com",
      categoryName: "Community",
    });

    request.flush(createGetAdminLinkItemOkResponse({ id: 9 }));

    httpTesting.verify();
  });

  test("choosing + Új kategória, typing a name and submitting sends the typed name", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "+ Új kategória" }),
    );

    await user.type(screen.getByLabelText("Új kategória neve"), "Blogok");
    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Blog");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://blog.example.com",
    );

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminLinkRequest()),
    );

    expect(request.request.body).toStrictEqual({
      title: "Blog",
      url: "https://blog.example.com",
      categoryName: "Blogok",
    });

    request.flush(createGetAdminLinkItemOkResponse({ id: 9 }));

    httpTesting.verify();
  });

  test("choosing Egyéb (nincs kategória) sends categoryName: null", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "Egyéb (nincs kategória)" }),
    );

    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Cikk");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://example.com",
    );

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminLinkRequest()),
    );

    expect(request.request.body).toStrictEqual({
      title: "Cikk",
      url: "https://example.com",
      categoryName: null,
    });

    request.flush(createGetAdminLinkItemOkResponse({ id: 9 }));

    httpTesting.verify();
  });

  test("an uncategorised link loaded in edit mode preselects Egyéb (nincs kategória)", async () => {
    const { httpTesting } = await renderAdminLinkForm("1");

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    const itemRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkItemRequest(1)),
    );
    itemRequest.flush(createGetAdminLinkItemOkResponse({ category: null }));

    await waitFor(() => {
      expect(screen.getByLabelText("Kategória").textContent).toContain(
        "Egyéb (nincs kategória)",
      );
    });

    httpTesting.verify();
  });

  test("a URL without a protocol shows the pattern error and blocks submit", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "Egyéb (nincs kategória)" }),
    );

    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Cikk");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "example.com",
    );
    await user.tab();

    await expect(
      screen.findByText("A cím protokollal együtt adható meg (pl.: https://)"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Beküldés" })).toBeDisabled();

    expect(httpTesting.match(matchCreateAdminLinkRequest())).toHaveLength(0);

    httpTesting.verify();
  });

  test("typing the reserved name Egyéb as a new category shows a validation error and blocks submit", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "+ Új kategória" }),
    );

    await user.type(screen.getByLabelText("Új kategória neve"), "Egyéb");
    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Cikk");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://example.com",
    );
    await user.tab();

    await expect(
      screen.findByText("Ez a kategórianév foglalt."),
    ).resolves.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Beküldés" })).toBeDisabled();

    expect(httpTesting.match(matchCreateAdminLinkRequest())).toHaveLength(0);

    httpTesting.verify();
  });

  test("edit mode prefills all three fields from GET /admin/links/1 and submits PUT", async () => {
    const { httpTesting } = await renderAdminLinkForm("1");

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(
      createGetAdminLinkCategoriesOkResponse([{ id: 1, name: "Community" }]),
    );

    const itemRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkItemRequest(1)),
    );
    itemRequest.flush(
      createGetAdminLinkItemOkResponse({
        id: 1,
        title: "Régi link",
        url: "https://old.example.com",
        category: { id: 1, name: "Community" },
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText<HTMLInputElement>("Hivatkozás szövege").value,
      ).toBe("Régi link");
    });

    expect(
      screen.getByLabelText<HTMLInputElement>("Hivatkozás URI címe").value,
    ).toBe("https://old.example.com");
    expect(screen.getByLabelText("Kategória").textContent).toContain(
      "Community",
    );

    await user.click(screen.getByRole("button", { name: "Link módosítása" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminLinkRequest(1)),
    );

    expect(request.request.body).toStrictEqual({
      title: "Régi link",
      url: "https://old.example.com",
      categoryName: "Community",
    });

    request.flush(createGetAdminLinkItemOkResponse({ id: 1 }));

    httpTesting.verify();
  });

  test("a 422 response renders the invalid-data message", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "Egyéb (nincs kategória)" }),
    );
    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Cikk");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://example.com",
    );

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminLinkRequest()),
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

  test("a 500 response renders the unexpected-error card", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "Egyéb (nincs kategória)" }),
    );
    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Cikk");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://example.com",
    );

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminLinkRequest()),
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

  test("the public links query is invalidated after a successful submit", async () => {
    const { httpTesting } = await renderAdminLinkForm();

    const queryClient = TestBed.inject(QueryClient);
    queryClient.setQueryData(queryKeys.links, []);
    queryClient.setQueryData(queryKeys.adminLinks, []);

    const categoriesRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    categoriesRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "Egyéb (nincs kategória)" }),
    );
    await user.type(screen.getByLabelText("Hivatkozás szövege"), "Cikk");
    await user.type(
      screen.getByLabelText("Hivatkozás URI címe"),
      "https://example.com",
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminLinkRequest()),
    );
    request.flush(createGetAdminLinkItemOkResponse({ id: 9 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/linkek"]);
    });

    expect(queryClient.getQueryState(queryKeys.links)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(queryKeys.adminLinks)?.isInvalidated).toBe(
      true,
    );

    // The create invalidates `adminLinkCategories`, and this component's own
    // categories query is still an active observer for that key, so it
    // refetches (same pattern as AdminOfferFormComponent's edit-mode PUT test).
    const refetchRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );
    refetchRequest.flush(createGetAdminLinkCategoriesOkResponse([]));

    httpTesting.verify();
  });
});

async function renderAdminLinkForm(id?: string) {
  const renderResult = await render(AdminLinkFormComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/linkek", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
