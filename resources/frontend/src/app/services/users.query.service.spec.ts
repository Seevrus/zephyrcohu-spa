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
import { updateProfileRequest } from "../../mocks/users/updateProfileRequest";
import { queryKeys } from "./queryKeys";
import { UsersQueryService } from "./users.query.service";

function contentQueryKeys() {
  return [
    queryKeys.integra("programfrissites"),
    queryKeys.news(),
    queryKeys.newsItem(),
    queryKeys.offers(),
    queryKeys.offerItem(),
    queryKeys.knowledgebase(),
    queryKeys.knowledgebaseItem(),
    queryKeys.knowledgebaseTags,
  ];
}

function adminQueryKeys() {
  return [
    queryKeys.adminDocuments,
    queryKeys.adminDocumentItem(1),
    queryKeys.adminKnowledgebase,
    queryKeys.adminKnowledgebaseItem(1),
    queryKeys.adminLinkCategories,
    queryKeys.adminLinks,
    queryKeys.adminLinkItem(1),
    queryKeys.adminNews,
    queryKeys.adminNewsItem(1),
    queryKeys.adminNewsletters,
    queryKeys.adminNewsletterItem(1),
    queryKeys.adminNewsletterRecipients(1),
    queryKeys.adminOffers,
    queryKeys.adminOfferItem(1),
    queryKeys.adminTags,
    queryKeys.adminUsers,
  ];
}

function seedQueries(queryClient: QueryClient) {
  for (const key of contentQueryKeys()) {
    queryClient.setQueryData(key, "cached");
  }
  queryClient.setQueryData(queryKeys.session, "cached");
}

function seedAdminQueries(queryClient: QueryClient) {
  for (const key of adminQueryKeys()) {
    queryClient.setQueryData(key, "cached");
  }
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

  test("logout removes every cached query, gated content and admin data alike", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);
    seedAdminQueries(queryClient);

    await user.click(screen.getByTestId("logout-button"));

    const request = await waitFor(() => httpTesting.expectOne(logoutRequest));
    request.flush(null);

    await waitFor(() => {
      for (const key of [...contentQueryKeys(), ...adminQueryKeys()]) {
        expect(queryClient.getQueryData(key)).toBeUndefined();
      }
    });

    // The session query is the one the header observes for the whole life of
    // the app, so it is emptied in place instead of removed.
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
    ).toStrictEqual([queryKeys.session]);
  });

  test("logout empties the session query instead of leaving the old identity readable", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    queryClient.setQueryData(queryKeys.session, { email: "a@b.com" });

    await user.click(screen.getByTestId("logout-button"));

    const request = await waitFor(() => httpTesting.expectOne(logoutRequest));
    request.flush(null);

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.session)).toBeNull();

      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });
  });

  test("logout drops the mutation cache so request bodies stop being readable", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);

    await user.click(screen.getByTestId("update-profile-button"));

    const updateRequest = await waitFor(() =>
      httpTesting.expectOne(updateProfileRequest),
    );
    updateRequest.flush(createGetSessionOkResponse());

    await waitFor(() => {
      expect(queryClient.getMutationCache().getAll()).not.toStrictEqual([]);
    });

    await user.click(screen.getByTestId("logout-button"));

    const logout = await waitFor(() => httpTesting.expectOne(logoutRequest));
    logout.flush(null);

    await waitFor(() => {
      expect(queryClient.getMutationCache().getAll()).toStrictEqual([]);
    });
  });

  test("deleteProfile empties the cache the same way logout does", async () => {
    const user = userEvent.setup();
    const queryClient = TestBed.inject(QueryClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    seedQueries(queryClient);
    seedAdminQueries(queryClient);

    await user.click(screen.getByTestId("delete-profile-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(deleteProfileRequest),
    );
    request.flush(null, { status: 204, statusText: "No Content" });

    await waitFor(() => {
      for (const key of [...contentQueryKeys(), ...adminQueryKeys()]) {
        expect(queryClient.getQueryData(key)).toBeUndefined();
      }

      expect(queryClient.getQueryData(queryKeys.session)).toBeNull();
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
      data-testid="update-profile-button"
      (click)="
        updateProfileMutation.mutate({
          email: 'a@b.com',
          newsletter: true,
          password: 'Password1!',
        })
      "
    >
      Update profile
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
  protected readonly updateProfileMutation = injectMutation(() =>
    this.usersQueryService.updateProfile(),
  );
  protected readonly updateProfileConfirmEmailMutation = injectMutation(() =>
    this.usersQueryService.updateProfileConfirmEmail(),
  );
}
