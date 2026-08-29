import { InjectionToken } from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";

import { QUERY_CLIENT_STALE_TIME } from "../constants/query";

export const testQueryClient = new InjectionToken<QueryClient>(
  "test-query-client",
  {
    factory() {
      return new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            retryDelay: 0,
            staleTime: QUERY_CLIENT_STALE_TIME,
          },
        },
      });
    },
  },
);
