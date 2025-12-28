import { TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { type RouterStateSnapshot } from "@angular/router";
import { type Mock } from "vitest";

import { AppTitleStrategy } from "./app.title.strategy";
import { BreadcrumbService } from "./services/breadcrumb.service";

describe("App Title Strategy", () => {
  let appTitleStrategy: AppTitleStrategy;
  let setBreadCrumbSpy: Mock<(title: string) => void>;
  let setTitleSpy: Mock<(newTitle: string) => void>;

  beforeEach(() => {
    vi.spyOn(AppTitleStrategy.prototype, "buildTitle").mockReturnValue(
      "Test Title",
    );

    setBreadCrumbSpy = vi.spyOn(BreadcrumbService.prototype, "setBreadcrumb");
    setTitleSpy = vi.spyOn(Title.prototype, "setTitle");

    TestBed.configureTestingModule({
      providers: [{ provide: Title }, { provide: BreadcrumbService }],
    });

    appTitleStrategy = TestBed.inject(AppTitleStrategy);
  });

  test("updates the title correctly", () => {
    appTitleStrategy.updateTitle({} as unknown as RouterStateSnapshot);

    expect(setTitleSpy).toHaveBeenCalledWith("Test Title - Zephyr Bt.");
    expect(setBreadCrumbSpy).toHaveBeenCalledWith("Test Title");
  });
});
