import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";
import type { ICellRendererParams } from "ag-grid-community";

import { type AdminNewsletterCollectionItem } from "../../../../types/admin-newsletters";
import { NewsletterProgressCellRendererComponent } from "./newsletter-progress-cell-renderer.component";

describe("NewsletterProgressCellRendererComponent", () => {
  test("renders the progress as text and as a labelled progress bar", async () => {
    await renderCellRenderer({ sentCount: 118, recipientCount: 120 });

    expect(screen.getByText("118 / 120")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar", {
      name: "Kiküldés: 118 / 120",
    });

    expect(progressBar).toHaveAttribute("aria-valuenow", "98");
  });

  test("reports a finished send instead of the fraction", async () => {
    await renderCellRenderer({
      sentCount: 120,
      recipientCount: 120,
      isSentToEveryone: true,
    });

    expect(screen.getByText("Kiküldve")).toBeInTheDocument();
    expect(screen.queryByText("120 / 120")).not.toBeInTheDocument();

    expect(
      screen.getByRole("progressbar", { name: "Kiküldés: 120 / 120" }),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  test("renders a zero-width bar when there is no eligible recipient", async () => {
    await renderCellRenderer({
      sentCount: 0,
      recipientCount: 0,
      isSentToEveryone: true,
    });

    expect(
      screen.getByRole("progressbar", { name: "Kiküldés: 0 / 0" }),
    ).toHaveAttribute("aria-valuenow", "0");
  });
});

async function renderCellRenderer(
  overrides: Partial<AdminNewsletterCollectionItem> = {},
) {
  const newsletter: AdminNewsletterCollectionItem = {
    id: 1,
    subject: "Zephyr hírlevél 2026 február",
    createdAt: new Date("2026-02-10T00:00:00.000Z"),
    recipientCount: 120,
    sentCount: 118,
    isSentToEveryone: false,
    ...overrides,
  };

  const renderResult = await render(NewsletterProgressCellRendererComponent, {
    providers: [provideZonelessChangeDetection()],
  });

  renderResult.fixture.componentInstance.agInit({
    data: newsletter,
  } as ICellRendererParams<AdminNewsletterCollectionItem>);
  renderResult.fixture.detectChanges();
  await renderResult.fixture.whenStable();

  return renderResult;
}
