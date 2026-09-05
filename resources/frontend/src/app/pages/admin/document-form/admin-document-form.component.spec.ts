import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import {
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminDocumentItemRequest } from "../../../../mocks/admin/documents/adminDocumentsRequest";
import { createGetAdminDocumentItemOkResponse } from "../../../../mocks/admin/documents/createGetAdminDocumentItemOkResponse";
import {
  matchCreateAdminDocumentRequest,
  matchUpdateAdminDocumentRequest,
} from "../../../../mocks/admin/documents/saveAdminDocumentRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { queryKeys } from "../../../services/queryKeys";
import { AdminDocumentFormComponent } from "./admin-document-form.component";

describe("AdminDocumentFormComponent", () => {
  const user = userEvent.setup();

  function createTestFile() {
    return new File(["x"], "test.pdf", { type: "application/pdf" });
  }

  /**
   * The Material datepicker calendar doesn't render usable controls under
   * jsdom, so its value is set through the component instance instead.
   */
  async function fillCreateForm(
    fixture: ComponentFixture<AdminDocumentFormComponent>,
  ) {
    await user.click(screen.getByLabelText("Kategória"));
    await user.click(
      await screen.findByRole("option", { name: "Tájékoztató" }),
    );

    await user.type(
      screen.getByLabelText("Honlapon megjelenő név"),
      "Tájékoztató 2026",
    );
    await user.type(screen.getByLabelText("Verzió"), "2.0");

    fixture.componentInstance.documentForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
  }

  test("blocks a create submit until a file is chosen and shows the required message", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);
    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    await expect(
      screen.findByText("Kötelező mező", {
        selector: ".admin-form-field-error",
      }),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("rejects an oversized file as soon as it is chosen and refuses to submit it", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);

    const oversized = createTestFile();
    Object.defineProperty(oversized, "size", { value: 51200 * 1024 + 1 });

    await user.upload(screen.getByLabelText("Feltöltendő fájl"), oversized);

    await expect(
      screen.findByText("A feltöltött fájl legfeljebb 50 MB méretű lehet.", {
        selector: ".admin-form-field-error",
      }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    // No round trip: the backend never sees a file it would only reject.
    httpTesting.verify();
  });

  test("clears the size error once an acceptable file is chosen", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);

    const oversized = createTestFile();
    Object.defineProperty(oversized, "size", { value: 51200 * 1024 + 1 });

    const fileInput = screen.getByLabelText("Feltöltendő fájl");

    await user.upload(fileInput, oversized);

    await expect(
      screen.findByText("A feltöltött fájl legfeljebb 50 MB méretű lehet."),
    ).resolves.toBeInTheDocument();

    await user.upload(fileInput, createTestFile());

    await waitFor(() => {
      expect(
        screen.queryByText("A feltöltött fájl legfeljebb 50 MB méretű lehet."),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminDocumentRequest()),
    );
    request.flush(createGetAdminDocumentItemOkResponse({ id: 9 }));

    httpTesting.verify();
  });

  test("submits the form as FormData carrying every field and the file", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);
    await user.upload(
      screen.getByLabelText("Feltöltendő fájl"),
      createTestFile(),
    );

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminDocumentRequest()),
    );

    const body = request.request.body as FormData;

    expect(body).toBeInstanceOf(FormData);
    expect(body.get("category")).toBe("tajekoztato");
    expect(body.get("displayName")).toBe("Tájékoztató 2026");
    expect(body.get("version")).toBe("2.0");
    expect(body.get("publishedAt")).toBe("2026-02-10");
    expect((body.get("file") as File).name).toBe("test.pdf");

    request.flush(createGetAdminDocumentItemOkResponse({ id: 9 }));

    httpTesting.verify();
  });

  test("does not set a Content-Type header on the upload request", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);
    await user.upload(
      screen.getByLabelText("Feltöltendő fájl"),
      createTestFile(),
    );

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminDocumentRequest()),
    );

    expect(request.request.headers.has("Content-Type")).toBe(false);

    request.flush(createGetAdminDocumentItemOkResponse({ id: 9 }));

    httpTesting.verify();
  });

  test("navigates back to the grid and invalidates the public Integra queries after a create", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();
    const queryClient = TestBed.inject(QueryClient);

    // Only a cached query can be marked invalidated, so seed the caches the
    // mutation is expected to touch (same setup as the offers form spec).
    queryClient.setQueryData(queryKeys.adminDocuments, []);
    queryClient.setQueryData(queryKeys.integra("tajekoztato"), { data: [] });
    queryClient.setQueryData(queryKeys.integra("programfrissites"), {
      data: [],
    });

    await fillCreateForm(fixture);
    await user.upload(
      screen.getByLabelText("Feltöltendő fájl"),
      createTestFile(),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminDocumentRequest()),
    );
    request.flush(createGetAdminDocumentItemOkResponse({ id: 9 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/integra"]);
    });

    expect(
      queryClient.getQueryState(queryKeys.adminDocuments)?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(queryKeys.integra("tajekoztato"))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(queryKeys.integra("programfrissites"))
        ?.isInvalidated,
    ).toBe(true);

    httpTesting.verify();
  });

  test("prefills the fields in edit mode, shows the current file name and submits without a file", async () => {
    const { httpTesting } = await renderAdminDocumentForm("3");

    const itemRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentItemRequest(3)),
    );
    itemRequest.flush(
      createGetAdminDocumentItemOkResponse({
        id: 3,
        category: "programfrissites",
        displayName: "Frissítés 2026.1",
        version: "2026.1",
        fileName: "update-2026-1.zip",
        publishedAt: "2026-03-01T00:00:00.000000Z",
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Honlapon megjelenő név")).toHaveValue(
        "Frissítés 2026.1",
      );
    });

    expect(screen.getByLabelText("Verzió")).toHaveValue("2026.1");
    await expect(
      screen.findByText("Csak akkor válassz fájlt, ha cserélni szeretnéd."),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByTestId("admin-document-form-component").textContent,
    ).toContain("update-2026-1.zip");

    await user.click(screen.getByRole("button", { name: "Fájl módosítása" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminDocumentRequest(3)),
    );

    const body = request.request.body as FormData;

    expect(body).toBeInstanceOf(FormData);
    expect(body.get("displayName")).toBe("Frissítés 2026.1");
    expect(body.get("category")).toBe("programfrissites");
    expect(body.get("file")).toBeNull();

    request.flush(createGetAdminDocumentItemOkResponse({ id: 3 }));

    httpTesting.verify();
  });

  test("renders the backend message verbatim when a 422 mentions the file", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);
    await user.upload(
      screen.getByLabelText("Feltöltendő fájl"),
      createTestFile(),
    );

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminDocumentRequest()),
    );
    request.flush(
      {
        message: "The given data was invalid.",
        errors: { file: ["Ez a fájl korábban már feltöltésre került!"] },
      },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByText("Ez a fájl korábban már feltöltésre került!"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the upload fails with a 500", async () => {
    const { httpTesting, fixture } = await renderAdminDocumentForm();

    await fillCreateForm(fixture);
    await user.upload(
      screen.getByLabelText("Feltöltendő fájl"),
      createTestFile(),
    );

    await user.click(screen.getByRole("button", { name: "Feltöltés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminDocumentRequest()),
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

  test("shows the unexpected-error card when the document cannot be loaded", async () => {
    const { httpTesting } = await renderAdminDocumentForm("3");

    const itemRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentItemRequest(3)),
    );
    itemRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });
});

async function renderAdminDocumentForm(id?: string) {
  const renderResult = await render(AdminDocumentFormComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/integra", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
