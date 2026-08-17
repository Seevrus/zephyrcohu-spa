import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import { expect } from "vitest";

import { type TagResponse } from "../../../types/knowledgebase";
import { KnowledgebaseArticleListItemComponent } from "./knowledgebase-article-list-item.component";

describe("Knowledgebase Article List Item", () => {
  test("renders with the correct title and date", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: undefined,
      mainContent: "Some test article",
      tags: [],
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    await expect(
      screen.findByTestId("knowledgebase-article-title"),
    ).resolves.toHaveTextContent("Test title");

    expect(
      screen.getByTestId("knowledgebase-article-updated-at"),
    ).toHaveTextContent("2026. február 8. vasárnap");
  });

  test("shows a chip for unread articles", async () => {
    const { container } = await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: false,
      mainContent: "Some test article",
      tags: [],
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    const chip = container.querySelector("mat-chip");

    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent("Új");
  });

  test("shows a link to the article if there is additional content", async () => {
    await renderComponent({
      additionalContent: "Test additional content",
      id: 1,
      isRead: false,
      mainContent: "Some test article",
      tags: [],
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    await expect(
      screen.findByTestId("knowledgebase-article-additional-content"),
    ).resolves.toHaveTextContent("Tovább...");
  });

  test("does not render a tags row when there are no tags", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: undefined,
      mainContent: "Some test article",
      tags: [],
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    await expect(
      screen.findByTestId("knowledgebase-article-main-content"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("knowledgebase-article-tags"),
    ).not.toBeInTheDocument();
  });

  test("renders each tag as a clickable link below the additional content link", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: undefined,
      mainContent: "Some test article",
      tags: [
        { id: 1, name: "Billing", count: 5 },
        { id: 2, name: "Onboarding", count: 3 },
      ],
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    const tagLinks = await screen.findAllByTestId(
      "knowledgebase-article-tag",
    );

    expect(tagLinks).toHaveLength(2);
    expect(tagLinks[0]).toHaveTextContent("Billing");
    expect(tagLinks[0]).toHaveAttribute(
      "href",
      "/tudasbazis/cikkek?cimke=1",
    );
    expect(tagLinks[1]).toHaveTextContent("Onboarding");
    expect(tagLinks[1]).toHaveAttribute(
      "href",
      "/tudasbazis/cikkek?cimke=2",
    );
  });
});

async function renderComponent({
  additionalContent,
  id,
  isRead,
  mainContent,
  tags,
  title,
  updatedAt,
}: {
  additionalContent: string | null;
  id: number;
  isRead: boolean | undefined;
  mainContent: string;
  tags: TagResponse[];
  title: string;
  updatedAt: Date;
}) {
  return render(KnowledgebaseArticleListItemComponent, {
    inputs: {
      additionalContent,
      id,
      isRead,
      mainContent,
      tags,
      title,
      updatedAt,
    },
    providers: [provideRouter([]), provideZonelessChangeDetection()],
  });
}
