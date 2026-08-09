import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";
import { expect } from "vitest";

import { OfferArticleListItemComponent } from "./offer-article-list-item.component";

describe("Offer Article List Item", () => {
  test("renders with the correct title and date", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      mainContent: "Some test offer",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    await expect(
      screen.findByTestId("offer-article-title"),
    ).resolves.toHaveTextContent("Test title");

    expect(screen.getByTestId("offer-article-updated-at")).toHaveTextContent(
      "2026. február 8. vasárnap",
    );
  });

  test("shows the main content", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      mainContent: "Some test offer",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    await expect(
      screen.findByTestId("offer-article-main-content"),
    ).resolves.toHaveTextContent("Some test offer");

    expect(
      screen.queryByTestId("offer-article-additional-content"),
    ).not.toBeInTheDocument();
  });

  test("shows a link to the offer item if there is additional content", async () => {
    await renderComponent({
      additionalContent: "Test additional content",
      id: 1,
      mainContent: "Some test offer",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    const link = await screen.findByRole("link", { name: "Tovább..." });

    expect(link).toHaveAttribute("href", "/ajanlatok/1");
  });
});

async function renderComponent({
  additionalContent,
  id,
  mainContent,
  title,
  updatedAt,
}: {
  additionalContent: string | null;
  id: number;
  mainContent: string;
  title: string;
  updatedAt: Date;
}) {
  return render(OfferArticleListItemComponent, {
    inputs: {
      additionalContent,
      id,
      mainContent,
      title,
      updatedAt,
    },
    providers: [provideZonelessChangeDetection()],
  });
}
