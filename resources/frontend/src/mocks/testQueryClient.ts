import { QueryClient } from "@tanstack/angular-query-experimental";

export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
