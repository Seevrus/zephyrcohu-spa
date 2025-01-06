import { type Title } from "@angular/platform-browser";
import { type RouterStateSnapshot } from "@angular/router";

import { AppTitleStrategy } from "./app.title.strategy";
import { type BreadcrumbService } from "./services/breadcrumb.service";

describe("App Title Strategy", () => {
  let appTitleStrategy: AppTitleStrategy;
  let breadcrumbServiceSpy: jasmine.SpyObj<BreadcrumbService>;
  let titleSpy: jasmine.SpyObj<Title>;

  beforeEach(() => {
    spyOn(AppTitleStrategy.prototype, "buildTitle").and.returnValue(
      "Test Title",
    );

    breadcrumbServiceSpy = jasmine.createSpyObj<BreadcrumbService>([
      "setBreadcrumb",
    ]);

    titleSpy = jasmine.createSpyObj<Title>(["setTitle"]);

    appTitleStrategy = new AppTitleStrategy(breadcrumbServiceSpy, titleSpy);
  });

  it("updates the title correctly", () => {
    appTitleStrategy.updateTitle({} as unknown as RouterStateSnapshot);

    expect(titleSpy.setTitle).toHaveBeenCalledWith("Test Title - Zephyr Bt.");
    expect(breadcrumbServiceSpy.setBreadcrumb).toHaveBeenCalledWith(
      "Test Title",
    );
  });
});