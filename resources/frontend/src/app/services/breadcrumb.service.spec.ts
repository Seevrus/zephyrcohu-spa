import { Component, inject } from "@angular/core";
import { render, screen, waitFor } from "@testing-library/angular";

import { BreadcrumbService } from "./breadcrumb.service";

describe("Breadcrumb Service", () => {
  let breadcrumbService: BreadcrumbService;

  @Component({
    selector: "app-fixture",
    template: `<div data-testid="breadcrumb">
      {{ breadcrumbService.breadcrumb() }}
    </div>`,
  })
  class TestComponent {
    readonly breadcrumbService = inject(BreadcrumbService);
  }

  beforeEach(async () => {
    await render(TestComponent, {
      configureTestBed(testBed) {
        breadcrumbService = testBed.inject(BreadcrumbService);
      },
      providers: [BreadcrumbService],
    });
  });

  describe("setBreadcrumb", () => {
    test("should set the correct breadcrumb value when setBreadcrumb is called", async () => {
      const expectedBreadcrumb = "Főoldal";

      breadcrumbService.setBreadcrumb("Főoldal");

      await waitFor(() => {
        expect(screen.getByTestId("breadcrumb")).toHaveTextContent(
          expectedBreadcrumb,
        );
      });
    });

    test("should set undefined if the breadcrumb does not exist", () => {
      breadcrumbService.setBreadcrumb("NonExistingBreadcrumb");

      expect(breadcrumbService.breadcrumb()).toBeUndefined();
    });
  });
});
