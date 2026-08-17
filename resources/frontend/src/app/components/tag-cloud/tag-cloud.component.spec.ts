import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import { expect } from "vitest";

import { type Tag } from "../../../types/knowledgebase";
import { TagCloudComponent } from "./tag-cloud.component";

describe("Tag Cloud", () => {
  test("renders nothing when there are no tags", async () => {
    await renderComponent([]);

    expect(screen.queryByTestId("tag-cloud")).not.toBeInTheDocument();
  });

  test("renders every tag as a clickable link", async () => {
    await renderComponent([
      { id: 1, name: "Billing", count: 5 },
      { id: 2, name: "Onboarding", count: 3 },
    ]);

    const items = await screen.findAllByTestId("tag-cloud-item");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Billing");
    expect(items[0]).toHaveAttribute("href", "/tudasbazis/cikkek?cimke=1");
    expect(items[1]).toHaveTextContent("Onboarding");
    expect(items[1]).toHaveAttribute("href", "/tudasbazis/cikkek?cimke=2");
  });

  test("assigns the largest tier to the most frequent tag and the smallest to the least frequent", async () => {
    const { container } = await renderComponent([
      { id: 1, name: "Rare", count: 1 },
      { id: 2, name: "Common", count: 10 },
    ]);

    const items = container.querySelectorAll('[data-testid="tag-cloud-item"]');

    expect(items[0]).toHaveClass("tag-cloud-tier-0");
    expect(items[1]).toHaveClass("tag-cloud-tier-4");
  });

  test("assigns the same tier to every tag when all counts are equal", async () => {
    const { container } = await renderComponent([
      { id: 1, name: "Alpha", count: 4 },
      { id: 2, name: "Beta", count: 4 },
    ]);

    const items = container.querySelectorAll('[data-testid="tag-cloud-item"]');

    expect(items[0]).toHaveClass("tag-cloud-tier-4");
    expect(items[1]).toHaveClass("tag-cloud-tier-4");
  });

  test("does not divide by zero for a single tag", async () => {
    const { container } = await renderComponent([
      { id: 1, name: "Solo", count: 1 },
    ]);

    const item = container.querySelector('[data-testid="tag-cloud-item"]');

    expect(item?.className).not.toContain("NaN");
    expect(item).toHaveTextContent("Solo");
  });
});

async function renderComponent(tags: Tag[]) {
  return render(TagCloudComponent, {
    inputs: { tags },
    providers: [provideRouter([]), provideZonelessChangeDetection()],
  });
}
