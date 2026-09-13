import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import {
  matchAdminNewsletterItemRequest,
  matchAdminNewsletterRecipientsRequest,
  matchSendNewsletterToRecipientRequest,
} from "../../../../mocks/admin/newsletters/adminNewslettersRequest";
import { createGetAdminNewsletterItemOkResponse } from "../../../../mocks/admin/newsletters/createGetAdminNewsletterItemOkResponse";
import { createGetAdminNewsletterRecipientsOkResponse } from "../../../../mocks/admin/newsletters/createGetAdminNewsletterRecipientsOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { DelayService } from "../../../services/delay.service";
import { AdminNewsletterSendComponent } from "./admin-newsletter-send.component";

const threeRecipients = [
  { id: 1, email: "user001@example.com" },
  { id: 2, email: "user002@example.com" },
  { id: 3, email: "user003@example.com" },
];

describe("AdminNewsletterSendComponent", () => {
  const user = userEvent.setup();

  test("renders the newsletter read-only, so the admin sees what is going out", async () => {
    const { httpTesting, container } = await renderAdminNewsletterSend();

    await flushNewsletter(httpTesting);
    await flushRecipients(httpTesting);

    await expect(
      screen.findByRole("heading", { name: "Zephyr hírlevél 2026 február" }),
    ).resolves.toBeInTheDocument();

    expect(container.textContent).toContain("Kedves Partnerünk!");

    httpTesting.verify();
  });

  test("waits for the admin to start: nothing is sent on load", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await flushNewsletter(httpTesting);
    await flushRecipients(httpTesting, threeRecipients);

    await expect(
      screen.findByText("3 címzett vár kiküldésre."),
    ).resolves.toBeInTheDocument();

    httpTesting.expectNone(matchSendNewsletterToRecipientRequest(1, 1));

    httpTesting.verify();
  });

  test("shows the completed sentence when no recipient is pending", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await flushNewsletter(httpTesting);
    await flushRecipients(httpTesting, []);

    await expect(
      screen.findByText("A hírlevél minden címzettnek kiküldésre került."),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Kiküldés indítása" }),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("sends to every recipient strictly one at a time, in list order", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, threeRecipients);

    const firstSend = await waitFor(() =>
      httpTesting.expectOne(matchSendNewsletterToRecipientRequest(1, 1)),
    );

    // The second send must not be in flight while the first one is unanswered.
    httpTesting.expectNone(matchSendNewsletterToRecipientRequest(1, 2));

    firstSend.flush(null, { status: 204, statusText: "No Content" });

    const secondSend = await waitFor(() =>
      httpTesting.expectOne(matchSendNewsletterToRecipientRequest(1, 2)),
    );

    httpTesting.expectNone(matchSendNewsletterToRecipientRequest(1, 3));

    secondSend.flush(null, { status: 204, statusText: "No Content" });

    const thirdSend = await waitFor(() =>
      httpTesting.expectOne(matchSendNewsletterToRecipientRequest(1, 3)),
    );
    thirdSend.flush(null, { status: 204, statusText: "No Content" });

    await expect(
      screen.findByText("Kiküldve: 3 / 3"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("advances the progress bar and its label after each send", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, threeRecipients);

    await flushSend(httpTesting, 1);

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", { name: "Kiküldés: 1 / 3" }),
      ).toBeInTheDocument();
    });

    await flushSend(httpTesting, 2);

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", { name: "Kiküldés: 2 / 3" }),
      ).toBeInTheDocument();
    });

    await flushSend(httpTesting, 3);

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", { name: "Kiküldés: 3 / 3" }),
      ).toBeInTheDocument();
    });

    httpTesting.verify();
  });

  test("a throttled send retries the same recipient and is counted once, as a success", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, [threeRecipients[0], threeRecipients[1]]);

    await flushThrottled(httpTesting, 1);

    // The same recipient is retried — the throttled request mailed nobody.
    await flushSend(httpTesting, 1);
    await flushSend(httpTesting, 2);

    await expect(
      screen.findByText("Kiküldve: 2 / 2"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByText("user001@example.com — Nem sikerült"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("a recipient that keeps being throttled is recorded as a failure and the loop moves on", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, [threeRecipients[0], threeRecipients[1]]);

    // One attempt plus the three capped retries.
    for (let attempt = 0; attempt < 4; attempt++) {
      await flushThrottled(httpTesting, 1);
    }

    await flushSend(httpTesting, 2);

    // The summary is the last thing to render, so it is what the test waits on —
    // asserting the rows first would race the run's final tick.
    await expect(
      screen.findByText("Kiküldve: 1 / 2"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText("user001@example.com — Nem sikerült"),
    ).toBeInTheDocument();

    httpTesting.verify();
  });

  test("a failed send is recorded and the loop continues with the next recipient", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, [threeRecipients[0], threeRecipients[1]]);

    const failingSend = await waitFor(() =>
      httpTesting.expectOne(matchSendNewsletterToRecipientRequest(1, 1)),
    );
    failingSend.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await flushSend(httpTesting, 2);

    await expect(
      screen.findByText("Kiküldve: 1 / 2"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText("user001@example.com — Nem sikerült"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("user002@example.com — Elküldve"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Néhány címzett esetén nem sikerült a küldés. A hírlevél újra megnyitható és a küldés folytatható.",
      ),
    ).toBeInTheDocument();

    httpTesting.verify();
  });

  test("the retry button re-fetches the pending recipients and runs again", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, [threeRecipients[0], threeRecipients[1]]);

    const failingSend = await waitFor(() =>
      httpTesting.expectOne(matchSendNewsletterToRecipientRequest(1, 1)),
    );
    failingSend.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );
    await flushSend(httpTesting, 2);

    await user.click(
      await screen.findByRole("button", { name: "Újrapróbálás" }),
    );

    // The server owns the pending list, so the retry asks for it again rather
    // than replaying the failures it remembers.
    await flushRecipients(httpTesting, [threeRecipients[0]]);
    await flushSend(httpTesting, 1);

    await expect(
      screen.findByText("Kiküldve: 1 / 1"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("aborting stops the run without waiting the pacing delay out", async () => {
    // This stub never resolves a wait on its own, so the run can only continue
    // if the abort promise resolves it.
    const { httpTesting } = await renderAdminNewsletterSend("1", {
      wait: (_ms: number, abort?: Promise<void>) =>
        abort ??
        new Promise<void>(() => {
          // Deliberately never resolves.
        }),
    });

    await startRun(httpTesting, threeRecipients);

    await flushSend(httpTesting, 1);

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", { name: "Kiküldés: 1 / 3" }),
      ).toBeInTheDocument();
    });

    // The pacing wait is holding the loop: recipient 2 has not been asked for.
    httpTesting.expectNone(matchSendNewsletterToRecipientRequest(1, 2));

    await user.click(screen.getByRole("button", { name: "Megszakítás" }));

    await expect(
      screen.findByText("Kiküldve: 1 / 3"),
    ).resolves.toBeInTheDocument();

    httpTesting.expectNone(matchSendNewsletterToRecipientRequest(1, 2));

    httpTesting.verify();
  });

  test("warns against leaving the page while the run is in progress", async () => {
    const { httpTesting } = await renderAdminNewsletterSend();

    await startRun(httpTesting, threeRecipients);

    await expect(
      screen.findByText(
        "A küldés folyamatban van, kérjük ne zárja be az oldalt.",
      ),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Vissza a hírlevelekhez" }),
    ).not.toBeInTheDocument();

    await flushSend(httpTesting, 1);
    await flushSend(httpTesting, 2);
    await flushSend(httpTesting, 3);

    await expect(
      screen.findByRole("link", { name: "Vissza a hírlevelekhez" }),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the not-found message for an unknown newsletter", async () => {
    const { httpTesting } = await renderAdminNewsletterSend("42");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsletterItemRequest(42)),
    );
    request.flush(
      { status: 404, code: "GENERIC_NOT_FOUND" },
      { status: 404, statusText: "Not Found" },
    );

    const recipientsRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsletterRecipientsRequest(42)),
    );
    recipientsRequest.flush(
      { status: 404, code: "GENERIC_NOT_FOUND" },
      { status: 404, statusText: "Not Found" },
    );

    await expect(
      screen.findByTestId("newsletter-not-found"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("redirects to the list when the id is not a number", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderAdminNewsletterSend("abc");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirlevel"], {
        replaceUrl: true,
      });
    });

    httpTesting.verify();
  });
});

async function startRun(
  httpTesting: HttpTestingController,
  recipients: { id: number; email: string }[],
) {
  await flushNewsletter(httpTesting);
  await flushRecipients(httpTesting, recipients);

  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "Kiküldés indítása" }));
}

async function flushNewsletter(httpTesting: HttpTestingController, id = 1) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminNewsletterItemRequest(id)),
  );

  request.flush(createGetAdminNewsletterItemOkResponse({ id }));
}

async function flushRecipients(
  httpTesting: HttpTestingController,
  recipients: { id: number; email: string }[] = [threeRecipients[0]],
  id = 1,
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminNewsletterRecipientsRequest(id)),
  );

  request.flush(createGetAdminNewsletterRecipientsOkResponse(recipients));
}

async function flushSend(
  httpTesting: HttpTestingController,
  userId: number,
  id = 1,
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchSendNewsletterToRecipientRequest(id, userId)),
  );

  request.flush(null, { status: 204, statusText: "No Content" });
}

async function flushThrottled(
  httpTesting: HttpTestingController,
  userId: number,
  id = 1,
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchSendNewsletterToRecipientRequest(id, userId)),
  );

  request.flush(
    { status: 429, code: "GENERIC_TOO_MANY_REQUESTS" },
    { status: 429, statusText: "Too Many Requests" },
  );
}

async function renderAdminNewsletterSend(
  id = "1",
  mockDelayService: Pick<DelayService, "wait"> = {
    wait: () => Promise.resolve(),
  },
) {
  const renderResult = await render(AdminNewsletterSendComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/hirlevel", children: [] }]),
      provideZonelessChangeDetection(),
      { provide: DelayService, useValue: mockDelayService },
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
