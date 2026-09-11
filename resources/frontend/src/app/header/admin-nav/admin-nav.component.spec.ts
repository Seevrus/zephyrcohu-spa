import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  type OutputRefKeysWithCallback,
  render,
  screen,
} from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

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
