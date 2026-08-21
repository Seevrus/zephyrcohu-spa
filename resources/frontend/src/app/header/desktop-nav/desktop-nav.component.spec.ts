import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  type OutputRefKeysWithCallback,
  render,
  screen,
} from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { DesktopNavComponent } from "./desktop-nav.component";

describe("Desktop Nav", () => {
  const user = userEvent.setup();

  test("does not show the admin funkciók button when showAdminNavigation is false", async () => {
    await renderDesktopNav({ currentUrl: "/", showAdminNavigation: false });

    expect(
      screen.queryByRole("button", { name: "Admin funkciók" }),
    ).not.toBeInTheDocument();
  });

  test("shows the admin funkciók button when showAdminNavigation is true", async () => {
    await renderDesktopNav({ currentUrl: "/", showAdminNavigation: true });

    expect(
      screen.getByRole("button", { name: "Admin funkciók" }),
    ).toBeInTheDocument();
  });

  test("marks the admin funkciók button active when the current url is an admin page", async () => {
    await renderDesktopNav({
      currentUrl: "/admin",
      showAdminNavigation: true,
    });

    expect(screen.getByRole("button", { name: "Admin funkciók" })).toHaveClass(
      "active-link",
    );
  });

  test("marks the Integra menu trigger active when the current url is an integra page", async () => {
    await renderDesktopNav({
      currentUrl: "/integra/tajekoztato",
      showAdminNavigation: false,
    });

    expect(screen.getByRole("button", { name: /Integra/ })).toHaveClass(
      "active-link",
    );
  });

  test("marks the Tudásbázis menu trigger active when the current url is a knowledgebase page", async () => {
    await renderDesktopNav({
      currentUrl: "/tudasbazis/cikkek",
      showAdminNavigation: false,
    });

    expect(screen.getByRole("button", { name: /Tudásbázis/ })).toHaveClass(
      "active-link",
    );
  });

  test("emits activateAdminNavigation when the admin funkciók button is clicked", async () => {
    const onActivateAdminNavigation = vi.fn<() => void>();

    await renderDesktopNav({
      currentUrl: "/",
      showAdminNavigation: true,
      on: { activateAdminNavigation: onActivateAdminNavigation },
    });

    await user.click(screen.getByRole("button", { name: "Admin funkciók" }));

    expect(onActivateAdminNavigation).toHaveBeenCalledExactlyOnceWith(
      undefined,
    );
  });
});

async function renderDesktopNav({
  currentUrl,
  showAdminNavigation,
  on,
}: {
  currentUrl: string;
  showAdminNavigation: boolean;
  on?: OutputRefKeysWithCallback<DesktopNavComponent>;
}) {
  return render(DesktopNavComponent, {
    inputs: { currentUrl, showAdminNavigation },
    on,
    providers: [provideRouter([]), provideZonelessChangeDetection()],
  });
}
