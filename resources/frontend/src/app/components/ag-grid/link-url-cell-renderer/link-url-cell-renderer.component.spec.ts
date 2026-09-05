import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";
import type { ICellRendererParams } from "ag-grid-community";

import type { AdminLinkResponse } from "../../../../types/admin-links";
import { LinkUrlCellRendererComponent } from "./link-url-cell-renderer.component";

describe("LinkUrlCellRendererComponent", () => {
  const testLink: AdminLinkResponse = {
    id: 1,
    title: "Test link",
    url: "https://example.com/page",
    category: { id: 1, name: "Community" },
  };

  test("renders the URL as an external link with rel=noopener noreferrer", async () => {
    await renderCellRenderer(testLink);

    const link = screen.getByRole("link", {
      name: "https://example.com/page",
    });

    expect(link).toHaveAttribute("href", "https://example.com/page");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

async function renderCellRenderer(link: AdminLinkResponse) {
  const renderResult = await render(LinkUrlCellRendererComponent, {
    providers: [provideZonelessChangeDetection()],
  });

  renderResult.fixture.componentInstance.agInit({
    data: link,
  } as ICellRendererParams<AdminLinkResponse>);
  renderResult.fixture.detectChanges();
  await renderResult.fixture.whenStable();

  return renderResult;
}
