import {
  Component,
  inject,
  provideZonelessChangeDetection,
} from "@angular/core";
import { render, screen, waitFor } from "@testing-library/angular";

import { BreadcrumbService } from "./breadcrumb.service";

describe("Breadcrumb Service", () => {
  let breadcrumbService: BreadcrumbService;

  beforeEach(async () => {
    await render(TestComponent, {
      configureTestBed(testBed) {
        breadcrumbService = testBed.inject(BreadcrumbService);
      },
      providers: [BreadcrumbService, provideZonelessChangeDetection()],
    });
  });

  test("setBreadcrumb should set the correct breadcrumb value", async () => {
    const expectedBreadcrumb = "Főoldal";

    breadcrumbService.setBreadcrumb("Főoldal");

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumb")).toHaveTextContent(
        expectedBreadcrumb,
      );
    });
  });
});

@Component({
  selector: "app-fixture",
  template: `<div data-testid="breadcrumb">
    {{ breadcrumbService.breadcrumb() }}
  </div>`,
})
class TestComponent {
  readonly breadcrumbService = inject(BreadcrumbService);
}
