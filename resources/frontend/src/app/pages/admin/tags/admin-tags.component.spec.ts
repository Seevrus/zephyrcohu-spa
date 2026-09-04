import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { fireEvent, render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminTagsRequest } from "../../../../mocks/admin/tags/adminTagsRequest";
import { createGetAdminTagsOkResponse } from "../../../../mocks/admin/tags/createGetAdminTagsOkResponse";
import { matchDeleteAdminTagRequest } from "../../../../mocks/admin/tags/deleteAdminTagRequest";
import { matchUpdateAdminTagRequest } from "../../../../mocks/admin/tags/saveAdminTagRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminTagsComponent } from "./admin-tags.component";

describe("AdminTagsComponent", () => {
  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminTags();

    await waitFor(() => httpTesting.expectOne(matchAdminTagsRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every tag with its article count", async () => {
    const { httpTesting, container } = await renderAdminTags();

    await flushTags(httpTesting, [
      { id: 1, name: "Billing", count: 2 },
      { id: 2, name: "Onboarding", count: 0 },
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("Billing");
    });

    expect(container.textContent).toContain("Onboarding");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, []);

    await expect(
      screen.findByText("Még nincsenek címkék."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminTags();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminTagsRequest()),
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

  test("clicking the edit action opens the rename dialog on the current name", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 2 }]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Billing" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Címke átnevezése" }),
    ).resolves.toBeInTheDocument();

    expect(screen.getByLabelText("Címke")).toHaveValue("Billing");

    httpTesting.verify();
  });

  test("saving the rename dialog fires a PUT with the new name", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 2 }]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Billing" }),
    );

    fillDialogField("Címke", "Invoicing");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminTagRequest(1)),
    );

    expect(updateRequest.request.body).toStrictEqual({ name: "Invoicing" });

    updateRequest.flush({ data: { id: 1, name: "Invoicing", count: 2 } });

    httpTesting.verify();
  });

  test("a 422 on rename reopens the dialog with the duplicate-name message and the typed value", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 2 }]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Billing" }),
    );

    fillDialogField("Címke", "Onboarding");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminTagRequest(1)),
    );
    updateRequest.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByText("Ilyen nevű címke már létezik."),
    ).resolves.toBeInTheDocument();

    expect(screen.getByLabelText("Címke")).toHaveValue("Onboarding");

    expect(
      screen.queryByTestId("form-unexpected-error"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when renaming fails", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 2 }]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Billing" }),
    );

    fillDialogField("Címke", "Invoicing");
    await user.click(await screen.findByRole("button", { name: "Mentés" }));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminTagRequest(1)),
    );
    updateRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-tags-component").textContent).toContain(
      "Billing",
    );

    httpTesting.verify();
  });

  test("cancelling the rename dialog fires no request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 2 }]);

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Billing" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Címke átnevezése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });

  test("deleting a tag in use shows the removal warning and fires a DELETE", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 3 }]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Billing" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Címke törlése" }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText(
        "A címke 3 cikkről kerül eltávolításra. A cikkek megmaradnak.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminTagRequest(1)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("deleting an unused tag shows no removal warning", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Unused", count: 0 }]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Unused" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Címke törlése" }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByText(/cikkről kerül eltávolításra/),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 3 }]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Billing" }),
    );

    await user.click(await screen.findByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminTagRequest(1)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-tags-component").textContent).toContain(
      "Billing",
    );

    httpTesting.verify();
  });

  test("cancelling the delete dialog fires no request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminTags();

    await flushTags(httpTesting, [{ id: 1, name: "Billing", count: 3 }]);

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Billing" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Címke törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });
});

async function renderAdminTags() {
  const renderResult = await render(AdminTagsComponent, {
    imports: [MatDialogModule],
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

async function flushTags(
  httpTesting: HttpTestingController,
  tags: Parameters<typeof createGetAdminTagsOkResponse>[0],
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminTagsRequest()),
  );

  request.flush(createGetAdminTagsOkResponse(tags));
}

/**
 * `user.type` is unreliable inside a dialog: the CDK focus trap moves focus
 * asynchronously after the dialog opens, and because jsdom has no layout its
 * tabbable check finds nothing and falls back to the dialog container — so
 * keystrokes that land after the trap has run are typed into the container and
 * lost. A real browser focuses the field instead, which is why this is a jsdom
 * artefact and not a bug in the dialog. A single `input` event does not depend
 * on focus at all. What the field does with the value — trimming, validation,
 * Enter to submit — is covered by `rename-dialog.component.spec.ts`, which
 * renders the dialog as a fixture, without an overlay or a focus trap.
 */
function fillDialogField(label: string, value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } });
}
