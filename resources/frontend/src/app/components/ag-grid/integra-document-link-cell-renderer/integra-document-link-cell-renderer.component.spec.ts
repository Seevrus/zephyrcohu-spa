import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";
import type { ICellRendererParams } from "ag-grid-community";

import { matchDownloadIntegraDocumentRequest } from "../../../../mocks/integra/downloadIntegraDocumentRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import type { IntegraItem } from "../../../../types/integra";
import { IntegraDocumentLinkCellRendererComponent } from "./integra-document-link-cell-renderer.component";

describe("IntegraDocumentLinkCellRendererComponent", () => {
  const testDocument: IntegraItem = {
    id: 42,
    category: "integra-flyer",
    displayName: "Test document",
    version: "1.0.0",
    publishedAt: new Date("2026-02-08T18:26:00.000000Z"),
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders the document's display name", async () => {
    await renderCellRenderer(testDocument);

    expect(screen.getByText("Test document")).toBeInTheDocument();
  });

  test("downloads the document when clicked", async () => {
    const { httpTesting } = await renderCellRenderer(testDocument);

    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-url");
    const revokeObjectUrlSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => void 0);
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => void 0);

    const user = userEvent.setup();
    await user.click(screen.getByText("Test document"));

    const downloadTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchDownloadIntegraDocumentRequest(42)),
    );

    downloadTestRequest.flush(new Blob(["file content"]), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Disposition": 'attachment; filename="doc.pdf"' },
    });

    expect(createObjectUrlSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClickSpy).toHaveBeenCalledWith();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test-url");

    httpTesting.verify();
  });

  test("downloads the document when activated with the enter key", async () => {
    const { httpTesting } = await renderCellRenderer(testDocument);

    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => void 0);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => void 0);

    const link = screen.getByText("Test document");
    link.focus();

    const user = userEvent.setup();
    await user.keyboard("{Enter}");

    const downloadTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchDownloadIntegraDocumentRequest(42)),
    );

    downloadTestRequest.flush(new Blob(["file content"]), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Disposition": 'attachment; filename="doc.pdf"' },
    });

    expect(anchorClickSpy).toHaveBeenCalledWith();

    httpTesting.verify();
  });
});

async function renderCellRenderer(integraItem: IntegraItem) {
  const renderResult = await render(IntegraDocumentLinkCellRendererComponent, {
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideZonelessChangeDetection(),
    ],
  });

  renderResult.fixture.componentInstance.agInit({
    data: integraItem,
  } as ICellRendererParams<IntegraItem>);
  renderResult.fixture.detectChanges();
  await renderResult.fixture.whenStable();

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
