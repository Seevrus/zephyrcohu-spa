import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  type RouterStateSnapshot,
} from "@angular/router";

import { integraCategoryGuard } from "./integra-category.guard";

describe("integraCategoryGuard", () => {
  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    });
  });

  test("allows navigation for a known category slug", () => {
    const result = TestBed.runInInjectionContext(() =>
      integraCategoryGuard(
        createRouteSnapshot("tajekoztato"),
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
  });

  test("redirects to the main page for an unknown category slug", () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      integraCategoryGuard(
        createRouteSnapshot("nemletezik"),
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toStrictEqual(router.parseUrl("/"));
  });

  test("redirects to the main page when the category param is missing", () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      integraCategoryGuard(
        createRouteSnapshot(null),
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toStrictEqual(router.parseUrl("/"));
  });
});

function createRouteSnapshot(kategoria: string | null): ActivatedRouteSnapshot {
  return {
    paramMap: convertToParamMap(kategoria ? { kategoria } : {}),
  } as ActivatedRouteSnapshot;
}
