import { QueryClient } from "@tanstack/angular-query-experimental";
import { afterEach, beforeEach } from "vitest";

export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * The cache reset has to be registered here rather than in `vitest.setup.ts`.
 * The `@angular/build:unit-test` builder bundles every setup file as its own
 * esbuild entry point, separate from the spec entry points, so a module shared
 * by both is instantiated twice. A `testQueryClient.clear()` call made from
 * `vitest.setup.ts` therefore clears a different `QueryClient` instance than the
 * one the spec files import and pass to `provideTanStackQuery`, leaving cached
 * query data to leak between tests. Registering the hook in this module means it
 * always runs against the instance the spec file actually uses.
 */
beforeEach(() => {
  testQueryClient.clear();
});

afterEach(() => {
  testQueryClient.clear();
});
