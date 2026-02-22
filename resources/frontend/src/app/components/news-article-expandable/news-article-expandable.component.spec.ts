import { render, screen } from "@testing-library/angular";
import { expect } from "vitest";

import { NewsArticleExpandableComponent } from "./news-article-expandable.component";

describe("News Article Expandable Component", () => {
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

  test("shows the additional content", async () => {
    await renderComponent({
      additionalContent:
        "Elkészült egy újabb frissítéscsomag, benne:<br /><ul><li>üzemben az új munkaügyi törzsrögzítő (fülek, lapok, automatizmusok, sablonok, testre szabható felület)</li><li>a munkajogviszonyokhoz dokumentumok és egy sor új adat ehhez az előbbi törzsben (szerződéskötéstől a megszüntetésig)</li><li>T34-es (ja, nem, hanem) T1041 és 42, egyenesen a programból az ÁNYK-ba (tank juh)</li><li>a következő ütemben beindulnak a dátumozott jogviszonyváltozatok és a csoportos műveletek (szerrződés, megszüntetés,...)</li><li>erősen átdolgozott ÁFA-analitika, online számlához, XML ÁFA-bevalláshoz</li><li>köbüki, vagyis 3.0 online számla adatkapcsolat</li><li>adatimport-lehetőség a NAV számla-XML formátumra (egyenesen a könyvelésbe) és rövidesen banki kivonatfeldolgozás is</li><li>meg az apró (átdolgozott listakezelés, sok apró reszelgetés a kezelő felületen, hogy még jobban kézre álljon, stb.)</li><li>friss dokumentációk</li></ul>Biztosan kihagytam egy csomó mindent. Ezek egy része fizetős, másik része nem, de a fizetős se túl fájdalmas (sajnos a programozókat is kell etetni, de a rácson benyúlni tilos és veszélyes). Szóval: tessék, lehet jelentkezni a frissítésért.",
      id: 1,
      isRead: false,
      mainContent: "Some test news",
      title: "Test title",
      updatedAt: new Date("2026-02-08T18:23:00.000000Z"),
    });

    expect(
      (await screen.findByTestId("news-article-additional-content")).innerHTML,
    ).toBe(
      "Elkészült egy újabb frissítéscsomag, benne:<br><ul><li>üzemben az új munkaügyi törzsrögzítő (fülek, lapok, automatizmusok, sablonok, testre szabható felület)</li><li>a munkajogviszonyokhoz dokumentumok és egy sor új adat ehhez az előbbi törzsben (szerződéskötéstől a megszüntetésig)</li><li>T34-es (ja, nem, hanem) T1041 és 42, egyenesen a programból az ÁNYK-ba (tank juh)</li><li>a következő ütemben beindulnak a dátumozott jogviszonyváltozatok és a csoportos műveletek (szerrződés, megszüntetés,...)</li><li>erősen átdolgozott ÁFA-analitika, online számlához, XML ÁFA-bevalláshoz</li><li>köbüki, vagyis 3.0 online számla adatkapcsolat</li><li>adatimport-lehetőség a NAV számla-XML formátumra (egyenesen a könyvelésbe) és rövidesen banki kivonatfeldolgozás is</li><li>meg az apró (átdolgozott listakezelés, sok apró reszelgetés a kezelő felületen, hogy még jobban kézre álljon, stb.)</li><li>friss dokumentációk</li></ul>Biztosan kihagytam egy csomó mindent. Ezek egy része fizetős, másik része nem, de a fizetős se túl fájdalmas (sajnos a programozókat is kell etetni, de a rácson benyúlni tilos és veszélyes). Szóval: tessék, lehet jelentkezni a frissítésért.",
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
  return render(NewsArticleExpandableComponent, {
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
