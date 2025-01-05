import { TestBed } from "@angular/core/testing";

import { BreadcrumbService } from "./breadcrumb.service";

describe("Breadcrumb Service", () => {
  let breadcrumbService: BreadcrumbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BreadcrumbService],
    });

    breadcrumbService = TestBed.inject(BreadcrumbService);
  });

  describe("setBreadCrumb", () => {
    it("should emit the correct breadcrumb value when setBreadCrumb is called", (done: DoneFn) => {
      const expectedBreadcrumb = "Főoldal";

      breadcrumbService.breadcrumbChanged.subscribe((breadcrumb) => {
        expect(breadcrumb).toBe(expectedBreadcrumb);
        done();
      });

      breadcrumbService.setBreadcrumb("Főoldal");
    });

    it("should emit undefined if the breadcrumb does not exist", (done: DoneFn) => {
      breadcrumbService.breadcrumbChanged.subscribe((breadcrumb) => {
        expect(breadcrumb).toBeUndefined();
        done();
      });

      breadcrumbService.setBreadcrumb("NonExistingBreadcrumb");
    });
  });
});
