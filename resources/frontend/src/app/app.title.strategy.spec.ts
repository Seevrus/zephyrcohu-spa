import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { type RouterStateSnapshot } from "@angular/router";

import { AppTitleStrategy } from "./app.title.strategy";
import { BreadcrumbService } from "./services/breadcrumb.service";

describe("App Title Strategy", () => {
  let appTitleStrategy: AppTitleStrategy;
  let setBreadCrumbSpy: jest.SpyInstance<void, [title: string]>;
  let setTitleSpy: jest.SpyInstance<void, [newTitle: string]>;

  beforeEach(() => {
    jest
      .spyOn(AppTitleStrategy.prototype, "buildTitle")
      .mockReturnValue("Test Title");

    setBreadCrumbSpy = jest.spyOn(BreadcrumbService.prototype, "setBreadcrumb");
    setTitleSpy = jest.spyOn(Title.prototype, "setTitle");

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Title },
        { provide: BreadcrumbService },
      ],
    });

    appTitleStrategy = TestBed.inject(AppTitleStrategy);
  });

  it("updates the title correctly", () => {
    appTitleStrategy.updateTitle({} as unknown as RouterStateSnapshot);

    expect(setTitleSpy).toHaveBeenCalledWith("Test Title - Zephyr Bt.");
    expect(setBreadCrumbSpy).toHaveBeenCalledWith("Test Title");
  });
});
