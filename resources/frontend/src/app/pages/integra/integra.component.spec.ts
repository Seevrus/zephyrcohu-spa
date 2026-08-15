import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";

import { createGetIntegraDocumentsErrorResponse } from "../../../mocks/integra/createGetIntegraDocumentsErrorResponse";
import { createGetIntegraDocumentsOkResponse } from "../../../mocks/integra/createGetIntegraDocumentsOkResponse";
import { matchIntegraDocumentsRequest } from "../../../mocks/integra/integraDocumentsRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { type IntegraCategorySlug } from "../../../types/integra";
import { IntegraComponent } from "./integra.component";

describe("IntegraComponent", () => {
  test("shows a progress bar while the documents are loading", async () => {
    const { httpTesting } = await renderIntegra("tajekoztato");

    const documentsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchIntegraDocumentsRequest("integra-flyer")),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();

    documentsTestRequest.flush(createGetIntegraDocumentsOkResponse());

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    httpTesting.verify();
  });

  test("renders a registered-only message if the documents require authentication", async () => {
    const { httpTesting } = await renderIntegra("tajekoztato");

    const documentsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchIntegraDocumentsRequest("integra-flyer")),
    );

    documentsTestRequest.flush(
      createGetIntegraDocumentsErrorResponse("GENERIC_UNAUTHORIZED"),
      { status: 401, statusText: "Unauthorized" },
    );

    await expect(
      screen.findByTestId("registered-only-component"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders an unexpected error message if the documents cannot be loaded", async () => {
    const { httpTesting } = await renderIntegra("tajekoztato");

    // The query retries up to 3 times on non-auth errors, so the initial
    // request and every retry need to be flushed before the query settles.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const documentsTestRequest = await waitFor(() =>
        httpTesting.expectOne(matchIntegraDocumentsRequest("integra-flyer")),
      );

      documentsTestRequest.flush(
        createGetIntegraDocumentsErrorResponse("INTERNAL_SERVER_ERROR"),
        { status: 500, statusText: "Internal Server Error" },
      );
    }

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders a no-documents message if the category has no documents", async () => {
    const { httpTesting } = await renderIntegra("tajekoztato");

    const documentsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchIntegraDocumentsRequest("integra-flyer")),
    );

    documentsTestRequest.flush(createGetIntegraDocumentsOkResponse([]));

    await expect(
      screen.findByTestId("no-integra-documents-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders the documents in the grid once loaded", async () => {
    const { httpTesting, container } = await renderIntegra("tajekoztato");

    const documentsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchIntegraDocumentsRequest("integra-flyer")),
    );

    documentsTestRequest.flush(
      createGetIntegraDocumentsOkResponse([
        {
          id: 1,
          displayName: "Test document",
          version: "1.2.3",
          publishedAt: "2026-02-08T18:26:00.000000Z",
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Test document");
    });

    expect(container.textContent).toContain("1.2.3");
    expect(container.textContent).toContain("2026. február 8.");

    httpTesting.verify();
  });

  test("requests documents for the selected category", async () => {
    const { httpTesting } = await renderIntegra("dokumentacio");

    const documentsTestRequest = await waitFor(() =>
      httpTesting.expectOne(
        matchIntegraDocumentsRequest("integra-documentation"),
      ),
    );

    expect(documentsTestRequest.request.url).toContain("integra-documentation");

    documentsTestRequest.flush(createGetIntegraDocumentsOkResponse());

    httpTesting.verify();
  });
});

async function renderIntegra(kategoria: IntegraCategorySlug) {
  const renderResult = await render(IntegraComponent, {
    inputs: { kategoria },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
