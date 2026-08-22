import { InjectionToken } from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";

export const testQueryClient = new InjectionToken<QueryClient>(
  "test-query-client",
  {
    factory() {
      return new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            retryDelay: 0,
          },
        },
      });
    },
  },
);
