import { render, screen } from "@testing-library/angular";
import { expect } from "vitest";

import { NewsArticleListItemComponent } from "./news-article-list-item.component";

describe("News Article List Item", () => {
  test("renders with the correct title and date", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: undefined,
      mainContent: "Some test news",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    await expect(
      screen.findByTestId("news-article-title"),
    ).resolves.toHaveTextContent("Test title");

    expect(screen.getByTestId("news-article-updated-at")).toHaveTextContent(
      "2026. február 8. vasárnap",
    );
  });

  test("shows a chip for unread news", async () => {
    const { container } = await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: false,
      mainContent: "Some test news",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    const chip = container.querySelector("#mat-mdc-chip-a0");

    expect(chip).toBeInTheDocument();

    expect(chip).toHaveTextContent("Új");
  });

  test("shows the main content", async () => {
    await renderComponent({
      additionalContent: null,
      id: 1,
      isRead: undefined,
      mainContent:
        "Legalábbis elképzelhetetlenül távolinak tűnnek azok az idők, amikor (majdnem) az összes problémánk szakmai természetű volt. Ritkán változó jogi környezet, nem számottevő infláció, áru- és információbőség (ami nem a hazugságok áradata), tervezhető holnapok, kiszámítható egészségügyi kockázatok ... hello, hello! Na, mindegy, jöjjön most néhány információ az éjszakai műszakból a folytatásban.<br /><br />",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    expect(
      (await screen.findByTestId("news-article-main-content")).innerHTML,
    ).toBe(
      "Legalábbis elképzelhetetlenül távolinak tűnnek azok az idők, amikor (majdnem) az összes problémánk szakmai természetű volt. Ritkán változó jogi környezet, nem számottevő infláció, áru- és információbőség (ami nem a hazugságok áradata), tervezhető holnapok, kiszámítható egészségügyi kockázatok ... hello, hello! Na, mindegy, jöjjön most néhány információ az éjszakai műszakból a folytatásban.<br><br>",
    );

    expect(
      screen.queryByTestId("news-article-additional-content"),
    ).not.toBeInTheDocument();
  });

  test("shows a link to the news item if there is additional content", async () => {
    await renderComponent({
      additionalContent: "Test additional content",
      id: 1,
      isRead: false,
      mainContent: "Some test news",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    expect(
      (await screen.findByTestId("news-article-additional-content")).innerHTML,
    ).toBe(
      '<a _ngcontent-a-c3678655185="" class="zephyr-link" href="/hirek/1">Tovább...</a>',
    );
  });
});

async function renderComponent({
  additionalContent,
  id,
  isRead,
  mainContent,
  title,
  updatedAt,
}: {
  additionalContent: string | null;
  id: number;
  isRead: boolean | undefined;
  mainContent: string;
  title: string;
  updatedAt: Date;
}) {
  return render(NewsArticleListItemComponent, {
    inputs: {
      additionalContent,
      id,
      isRead,
      mainContent,
      title,
      updatedAt,
    },
  });
}
