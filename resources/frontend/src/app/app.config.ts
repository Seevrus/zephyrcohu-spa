import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import {
  type ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter, TitleStrategy } from "@angular/router";
import {
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { withDevtools } from "@tanstack/angular-query-experimental/devtools";
import {
  RECAPTCHA_SETTINGS,
  RecaptchaModule,
  type RecaptchaSettings,
} from "ng-recaptcha-2";

import { environment } from "../environments/environment";
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
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([credentialsInterceptor, xsrfInterceptor]),
    ),
    provideRouter(routes),
    provideTanStackQuery(queryClient, withDevtools()),
    importProvidersFrom(RecaptchaModule),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.siteKey,
        size: "invisible",
      } satisfies RecaptchaSettings,
    },
  ],
};
