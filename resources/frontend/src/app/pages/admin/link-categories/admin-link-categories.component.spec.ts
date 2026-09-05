import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { fireEvent, render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminLinkCategoriesRequest } from "../../../../mocks/admin/links/adminLinkCategoriesRequest";
import {
  matchDeleteAdminLinkCategoryRequest,
  matchUpdateAdminLinkCategoryRequest,
} from "../../../../mocks/admin/links/adminLinkCategoryRequests";
import { createGetAdminLinkCategoriesOkResponse } from "../../../../mocks/admin/links/createGetAdminLinkCategoriesOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminLinkCategoriesComponent } from "./admin-link-categories.component";

describe("AdminLinkCategoriesComponent", () => {
  const user = userEvent.setup();

  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every category with its link count", async () => {
    const { httpTesting, container } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 2 },
      { id: 2, name: "News", linkCount: 0 },
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("Community");
    });

    expect(container.textContent).toContain("News");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, []);

    await expect(
      screen.findByText("Még nincsenek kategóriák."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
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

  test("saving the rename dialog fires a PUT with the new name", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 2 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Community" }),
    );

    fillDialogField("Kategória", "Partners");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminLinkCategoryRequest(1)),
    );

    expect(updateRequest.request.body).toStrictEqual({ name: "Partners" });

    updateRequest.flush({ data: { id: 1, name: "Partners", linkCount: 2 } });

    httpTesting.verify();
  });

  test("a 422 on rename reopens the dialog with the duplicate-name message", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 2 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Community" }),
    );

    fillDialogField("Kategória", "News");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminLinkCategoryRequest(1)),
    );
    updateRequest.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByText("Ilyen nevű kategória már létezik."),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("form-unexpected-error"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renaming to the reserved name Egyéb surfaces the reserved-name message", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 2 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Community" }),
    );

    fillDialogField("Kategória", "Egyéb");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminLinkCategoryRequest(1)),
    );
    updateRequest.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByText("Ez a kategórianév foglalt."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when renaming fails", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 2 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Community" }),
    );

    fillDialogField("Kategória", "Partners");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminLinkCategoryRequest(1)),
    );
    updateRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByTestId("admin-link-categories-component").textContent,
    ).toContain("Community");

    httpTesting.verify();
  });

  test("cancelling the rename dialog fires no request", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 2 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Community" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Kategória átnevezése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });

  test("deleting a category in use shows the reassuring warning with the link count and fires a DELETE", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 3 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Community" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Kategória törlése" }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText(
        "A kategóriához tartozó 3 link megmarad, és az „Egyéb” csoportba kerül.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminLinkCategoryRequest(1)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("deleting an unused category shows no such warning", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Unused", linkCount: 0 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Unused" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Kategória törlése" }),
    ).resolves.toBeInTheDocument();

    expect(screen.queryByText(/megmarad/)).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 3 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Community" }),
    );

    await user.click(await screen.findByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminLinkCategoryRequest(1)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByTestId("admin-link-categories-component").textContent,
    ).toContain("Community");

    httpTesting.verify();
  });

  test("cancelling the delete dialog fires no request", async () => {
    const { httpTesting } = await renderAdminLinkCategories();

    await flushCategories(httpTesting, [
      { id: 1, name: "Community", linkCount: 3 },
    ]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Community" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Kategória törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });
});

async function renderAdminLinkCategories() {
  const renderResult = await render(AdminLinkCategoriesComponent, {
    imports: [MatDialogModule],
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

async function flushCategories(
  httpTesting: HttpTestingController,
  categories: Parameters<typeof createGetAdminLinkCategoriesOkResponse>[0],
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminLinkCategoriesRequest()),
  );

  request.flush(createGetAdminLinkCategoriesOkResponse(categories));
}

/**
 * See the identical helper in `admin-tags.component.spec.ts` for why a plain
 * `input` event is used instead of `user.type` inside a dialog.
 */
function fillDialogField(label: string, value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } });
}
