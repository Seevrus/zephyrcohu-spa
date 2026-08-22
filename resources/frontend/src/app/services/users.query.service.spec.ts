import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  Component,
  inject,
  provideZonelessChangeDetection,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  injectMutation,
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { testQueryClient } from "../../mocks/testQueryClient";
import { createGetSessionOkResponse } from "../../mocks/users/createGetSessionOkResponse";
import { deleteProfileRequest } from "../../mocks/users/deleteProfileRequest";
import { loginRequest } from "../../mocks/users/loginRequest";
import { logoutRequest } from "../../mocks/users/logoutRequest";
import { resetPasswordRequest } from "../../mocks/users/resetPasswordRequest";
import { updateProfileConfirmEmailRequest } from "../../mocks/users/updateProfileConfirmEmailRequest";
import { INTEGRA_CATEGORIES } from "../../types/integra";
import { queryKeys } from "./queryKeys";
import { UsersQueryService } from "./users.query.service";

function contentQueryKeys() {
  return [
    queryKeys.integra(INTEGRA_CATEGORIES.programfrissites),
    queryKeys.news(),
    queryKeys.newsItem(),
    queryKeys.offers(),
    queryKeys.offerItem(),
    queryKeys.knowledgebase(),
    queryKeys.knowledgebaseItem(),
    queryKeys.knowledgebaseTags,
  ];
}

function seedQueries(queryClient: QueryClient) {
  for (const key of contentQueryKeys()) {
    queryClient.setQueryData(key, "cached");
  }
  queryClient.setQueryData(queryKeys.session, "cached");
}

function expectContentQueriesInvalidated(queryClient: QueryClient) {
  for (const key of contentQueryKeys()) {
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  }
}

describe("UsersQueryService", () => {
  beforeEach(async () => {
    await render(TestComponent, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        provideZonelessChangeDetection(),
      ],
    });
  });

  test("login invalidates gated content and session queries", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);

    await user.click(screen.getByTestId("login-button"));

    const request = await waitFor(() => httpTesting.expectOne(loginRequest));
    request.flush(createGetSessionOkResponse());

    await waitFor(() => {
      expectContentQueriesInvalidated(queryClient);

      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });
  });

  test("logout invalidates gated content and session queries", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);

    await user.click(screen.getByTestId("logout-button"));

    const request = await waitFor(() => httpTesting.expectOne(logoutRequest));
    request.flush(null);

    await waitFor(() => {
      expectContentQueriesInvalidated(queryClient);

      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });
  });

  test("deleteProfile invalidates gated content and session queries", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);

    await user.click(screen.getByTestId("delete-profile-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(deleteProfileRequest),
    );
    request.flush(null, { status: 204, statusText: "No Content" });

    await waitFor(() => {
      expectContentQueriesInvalidated(queryClient);

      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });
  });

  test("resetPassword invalidates gated content and session queries", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);

    await user.click(screen.getByTestId("reset-password-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(resetPasswordRequest),
    );
    request.flush(createGetSessionOkResponse());

    await waitFor(() => {
      expectContentQueriesInvalidated(queryClient);

      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });
  });

  test("updateProfileConfirmEmail invalidates gated content and session queries", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);

    await user.click(screen.getByTestId("update-profile-confirm-email-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(updateProfileConfirmEmailRequest),
    );
    request.flush(createGetSessionOkResponse());

    await waitFor(() => {
      expectContentQueriesInvalidated(queryClient);

      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });
  });
});

@Component({
  selector: "app-fixture",
  template: `<div>
    <button
      data-testid="login-button"
      (click)="
        loginMutation.mutate({ email: 'a@b.com', password: 'Password1!' })
      "
    >
      Login
    </button>
    <button data-testid="logout-button" (click)="logoutMutation.mutate()">
      Logout
    </button>
    <button
      data-testid="delete-profile-button"
      (click)="deleteProfileMutation.mutate()"
    >
      Delete profile
    </button>
    <button
      data-testid="reset-password-button"
      (click)="
        resetPasswordMutation.mutate({
          code: 'code',
          email: 'a@b.com',
          password: 'Password1!',
        })
      "
    >
      Reset password
    </button>
    <button
      data-testid="update-profile-confirm-email-button"
      (click)="
        updateProfileConfirmEmailMutation.mutate({
          code: 'code',
          email: 'a@b.com',
          password: 'Password1!',
        })
      "
    >
      Update profile confirm email
    </button>
  </div>`,
})
class TestComponent {
  private readonly usersQueryService = inject(UsersQueryService);

  protected readonly loginMutation = injectMutation(() =>
    this.usersQueryService.login(),
  );
  protected readonly logoutMutation = injectMutation(() =>
    this.usersQueryService.logout(),
  );
  protected readonly deleteProfileMutation = injectMutation(() =>
    this.usersQueryService.deleteProfile(),
  );
  protected readonly resetPasswordMutation = injectMutation(() =>
    this.usersQueryService.resetPassword(),
  );
  protected readonly updateProfileConfirmEmailMutation = injectMutation(() =>
    this.usersQueryService.updateProfileConfirmEmail(),
  );
}
