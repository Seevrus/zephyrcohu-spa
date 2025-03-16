import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import {
  type ApplicationConfig,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter, TitleStrategy } from "@angular/router";
import {
  provideTanStackQuery,
  QueryClient,
  withDevtools,
} from "@tanstack/angular-query-experimental";

import { routes } from "./app.routes";
import { AppTitleStrategy } from "./app.title.strategy";
import { credentialsInterceptor } from "./services/credentialsInterceptor";
import { xsrfInterceptor } from "./services/xsrfInterceptor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: true,
      retry(failureCount) {
        return failureCount < 3;
      },
      retryDelay(attemptIndex) {
        return attemptIndex * 2 * 1000;
      },
      staleTime: 30 * 60 * 1000,
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([credentialsInterceptor, xsrfInterceptor]),
    ),
    provideRouter(routes),
    provideTanStackQuery(queryClient, withDevtools()),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
};
