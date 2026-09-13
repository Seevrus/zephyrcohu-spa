import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressBar } from "@angular/material/progress-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import DOMPurify from "dompurify";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import { type AdminNewsletterRecipient } from "../../../../types/admin-newsletters";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminNewslettersQueryService } from "../../../services/admin-newsletters.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { DelayService } from "../../../services/delay.service";
import { queryKeys } from "../../../services/queryKeys";

type SendResult = {
  email: string;
  status: "ok" | "error";
};

const MAX_THROTTLE_RETRIES = 3;
const WAIT_MS_BETWEEN_SENDS = 1_000;
const THROTTLE_WAIT_MS = 60_000;

@Component({
  selector: "app-admin-newsletter-send",
  host: {
    class: "app-admin-newsletter-send",
  },
  imports: [
    FormUnexpectedErrorComponent,
    MatButton,
    MatIcon,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-newsletter-send.component.html",
  styleUrl: "./admin-newsletter-send.component.scss",
})
export class AdminNewsletterSendComponent {
  private readonly adminNewslettersQueryService = inject(
    AdminNewslettersQueryService,
  );
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly delayService = inject(DelayService);
  private readonly queryClient = inject(QueryClient);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly titleService = inject(Title);

  readonly id = input<string>();

  protected readonly numericId = computed(() => {
    const id = this.id();

    if (id === undefined) {
      return;
    }

    const parsed = Number(id);

    return Number.isInteger(parsed) ? parsed : undefined;
  });

  private readonly hasInvalidId = computed(
    () => this.id() !== undefined && this.numericId() === undefined,
  );

  private readonly newsletterQuery = injectQuery(() =>
    this.adminNewslettersQueryService.getAdminNewsletter(this.numericId()),
  );

  private readonly recipientsQuery = injectQuery(() =>
    this.adminNewslettersQueryService.getAdminNewsletterRecipients(
      this.numericId(),
    ),
  );

  private readonly sendMutation = injectMutation(() =>
    this.adminNewslettersQueryService.sendNewsletterToRecipient(),
  );

  protected readonly subject = computed(
    () => this.newsletterQuery.data()?.subject,
  );

  protected readonly contentHtml = computed(() => {
    const content = this.newsletterQuery.data()?.content;

    return content
      ? this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(content))
      : "";
  });

  protected readonly isLoading = computed(
    () => this.newsletterQuery.isLoading() || this.recipientsQuery.isLoading(),
  );

  protected readonly isNotFound = computed(
    () => this.newsletterQuery.error()?.code === "GENERIC_NOT_FOUND",
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(() => {
    if (this.isNotFound()) {
      return;
    }

    return this.newsletterQuery.isError() || this.recipientsQuery.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined;
  });

  protected readonly pendingCount = computed(
    () => this.recipientsQuery.data()?.length ?? 0,
  );

  protected readonly results = signal<SendResult[]>([]);
  protected readonly isSending = signal(false);
  protected readonly hasRun = signal(false);

  protected readonly totalNumberOfRecipients = signal(0);

  protected readonly numberOfProcessedRecipients = computed(
    () => this.results().length,
  );

  protected readonly sentCount = computed(
    () => this.results().filter((result) => result.status === "ok").length,
  );

  protected readonly failureCount = computed(
    () => this.results().filter((result) => result.status === "error").length,
  );

  protected readonly progressPercent = computed(() => {
    const totalNumberOfRecipients = this.totalNumberOfRecipients();

    return totalNumberOfRecipients === 0
      ? 0
      : (this.numberOfProcessedRecipients() / totalNumberOfRecipients) * 100;
  });

  protected readonly roundedProgressPercent = computed(() =>
    Math.round(this.progressPercent()),
  );

  protected readonly progressLabel = computed(
    () =>
      `Kiküldés: ${this.numberOfProcessedRecipients()} / ${this.totalNumberOfRecipients()}`,
  );

  private isSendAborted = signal(false);
  private abortSendPromise?: Promise<void>;
  private resolveAbortSend?: () => void;

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/hirlevel"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const subject = this.subject();

    if (subject) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Hírlevél kiküldése - ${subject}`,
      );
      this.titleService.setTitle(`${subject} - Zephyr Bt.`);
    }
  });

  async startSending() {
    await this.runSending(this.recipientsQuery.data());
  }

  protected async retrySending() {
    /**
     * The still-pending recipients come from the server,
     * so we need refetching
     */
    const { data } = await this.recipientsQuery.refetch();

    await this.runSending(data);
  }

  protected abortSending() {
    this.isSendAborted.set(true);
    this.resolveAbortSend?.();
  }

  private async runSending(recipients: AdminNewsletterRecipient[] | undefined) {
    const newsletterId = this.numericId();

    if (
      newsletterId === undefined ||
      recipients === undefined ||
      recipients.length === 0 ||
      this.isSending()
    ) {
      return;
    }

    this.results.set([]);
    this.totalNumberOfRecipients.set(recipients.length);
    this.isSendAborted.set(false);

    this.abortSendPromise = new Promise<void>((resolve) => {
      this.resolveAbortSend = resolve;
    });

    this.isSending.set(true);

    for (const recipient of recipients) {
      if (this.isSendAborted()) {
        break;
      }

      await this.sendToRecipient(newsletterId, recipient.id, recipient.email);

      if (this.isSendAborted()) {
        break;
      }

      await this.delayService.wait(
        WAIT_MS_BETWEEN_SENDS,
        this.abortSendPromise,
      );
    }

    this.isSending.set(false);
    this.hasRun.set(true);

    /**
     * The counters should only be invalidated once the run ends
     */
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.adminNewsletters,
    });

    /**
     * this page is itself the item query's
     * observer, refetching them now would be a request nobody reads
     */
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.adminNewsletterItem(newsletterId),
      refetchType: "none",
    });
  }

  private async sendToRecipient(
    newsletterId: number,
    userId: number,
    email: string,
  ) {
    for (
      let throttleRetries = 0;
      throttleRetries <= MAX_THROTTLE_RETRIES;
      throttleRetries++
    ) {
      try {
        await this.sendMutation.mutateAsync({ newsletterId, userId });
        this.results.update((results) => [...results, { email, status: "ok" }]);

        return;
      } catch (error) {
        const isThrottled =
          error instanceof ZephyrHttpError && error.status === 429;

        if (!isThrottled || throttleRetries === MAX_THROTTLE_RETRIES) {
          this.results.update((results) => [
            ...results,
            { email, status: "error" },
          ]);

          return;
        }

        await this.delayService.wait(THROTTLE_WAIT_MS, this.abortSendPromise);

        if (this.isSendAborted()) {
          return;
        }
      }
    }
  }
}
