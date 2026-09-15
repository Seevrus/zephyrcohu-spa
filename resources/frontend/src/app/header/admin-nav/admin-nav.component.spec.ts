import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  type OutputRefKeysWithCallback,
  render,
  screen,
} from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { adminRoutes } from "../../admin.routes";
import { AdminNavComponent } from "./admin-nav.component";

describe("Admin Nav", () => {
  const user = userEvent.setup();

  test("renders the admin menu triggers and the users link", async () => {
    await renderAdminNav({ currentUrl: "/admin" });

    expect(
      screen.getByRole("button", { name: /Ajánlatok/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Felhasználók" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hasznos linkek/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hírek/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hírlevél/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /INTEGRA/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tudásbázis/ }),
    ).toBeInTheDocument();
  });

  test("every link in the admin navigation points at a declared admin route", async () => {
    const { container } = await renderAdminNav({ currentUrl: "/admin" });

    // Menu items only exist in the DOM while their menu is open, so every
    // trigger is opened in turn and its links collected.
    const links = new Set<string>();

    for (const element of container.querySelectorAll("a[routerlink]")) {
      links.add(element.getAttribute("routerlink")!);
    }

    for (const trigger of screen.getAllByRole("button")) {
      await user.click(trigger);

      for (const element of document.querySelectorAll(
        ".mat-mdc-menu-panel a[routerlink]",
      )) {
        links.add(element.getAttribute("routerlink")!);
      }
    }

    // Spelled out so that a link the traversal fails to reach - or a new one
    // nobody meant to add - shows up here rather than passing silently.
    expect([...links].sort((a, b) => a.localeCompare(b))).toStrictEqual([
      "/admin/ajanlatok",
      "/admin/ajanlatok/uj",
      "/admin/felhasznalok",
      "/admin/hirek",
      "/admin/hirek/uj",
      "/admin/hirlevel",
      "/admin/hirlevel/uj",
      "/admin/integra",
      "/admin/integra/uj",
      "/admin/linkek",
      "/admin/linkek/kategoriak",
      "/admin/linkek/uj",
      "/admin/tudasbazis",
      "/admin/tudasbazis/cimkek",
      "/admin/tudasbazis/uj",
    ]);

    const declaredPaths = new Set(adminRoutes.map((route) => route.path));

    for (const link of links) {
      expect(declaredPaths).toContain(link.slice("/admin/".length));
    }
  });

  test.each([
    ["/admin/ajanlatok", "Ajánlatok", "button"],
    ["/admin/felhasznalok", "Felhasználók", "link"],
    ["/admin/felhasznalok/1", "Felhasználók", "link"],
    ["/admin/felhasznalok/1/email", "Felhasználók", "link"],
    ["/admin/hirek", "Hírek", "button"],
    ["/admin/hirlevel", "Hírlevél", "button"],
    ["/admin/integra", "INTEGRA", "button"],
    ["/admin/linkek", "Hasznos linkek", "button"],
    ["/admin/tudasbazis", "Tudásbázis", "button"],
  ] as const)(
    "marks the %s menu trigger active when the current url is %s",
    async (currentUrl, name, role) => {
      await renderAdminNav({ currentUrl });

      expect(screen.getByRole(role, { name: new RegExp(name) })).toHaveClass(
        "active-link",
      );
    },
  );

  test("marks 'Felhasználói funkciók' active when not on an admin page", async () => {
    await renderAdminNav({ currentUrl: "/" });

    expect(
      screen.getByRole("button", { name: "Felhasználói funkciók" }),
    ).toHaveClass("active-link");
  });

  test("emits deactivateAdminNavigation when 'Felhasználói funkciók' is clicked", async () => {
    const onDeactivateAdminNavigation = vi.fn<() => void>();

    await renderAdminNav({
      currentUrl: "/admin",
      on: { deactivateAdminNavigation: onDeactivateAdminNavigation },
    });

    await user.click(
      screen.getByRole("button", { name: "Felhasználói funkciók" }),
    );

    expect(onDeactivateAdminNavigation).toHaveBeenCalledExactlyOnceWith(
      undefined,
    );
  });
});

async function renderAdminNav({
  currentUrl,
  on,
}: {
  currentUrl: string;
  on?: OutputRefKeysWithCallback<AdminNavComponent>;
}) {
  return render(AdminNavComponent, {
    inputs: { currentUrl },
    on,
    providers: [provideRouter([]), provideZonelessChangeDetection()],
  });
}
