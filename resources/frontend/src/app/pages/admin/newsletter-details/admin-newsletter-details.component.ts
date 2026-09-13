import { Component, computed, effect, inject, input } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDivider } from "@angular/material/list";
import { MatProgressBar } from "@angular/material/progress-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import DOMPurify from "dompurify";

import { formatDisplayDateWithoutDay } from "../../../../mappers/dates";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminNewslettersQueryService } from "../../../services/admin-newsletters.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";

@Component({
  selector: "app-admin-newsletter-details",
  host: {
    class: "app-admin-newsletter-details",
  },
  imports: [
    FormUnexpectedErrorComponent,
    MatButton,
    MatDivider,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-newsletter-details.component.html",
  styleUrl: "./admin-newsletter-details.component.scss",
})
export class AdminNewsletterDetailsComponent {
  private readonly adminNewslettersQueryService = inject(
    AdminNewslettersQueryService,
  );
  private readonly breadcrumbService = inject(BreadcrumbService);
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

  protected readonly subject = computed(
    () => this.newsletterQuery.data()?.subject,
  );

  protected readonly contentHtml = computed(() => {
    const content = this.newsletterQuery.data()?.content;

    return content
      ? this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(content))
      : "";
  });

  protected readonly displayCreatedAt = computed(() => {
    const createdAt = this.newsletterQuery.data()?.createdAt;

    return createdAt ? formatDisplayDateWithoutDay(createdAt) : "";
  });

  protected readonly sentCount = computed(
    () => this.newsletterQuery.data()?.sentCount ?? 0,
  );

  protected readonly recipientCount = computed(
    () => this.newsletterQuery.data()?.recipientCount ?? 0,
  );

  protected readonly isSentToEveryone = computed(
    () => this.newsletterQuery.data()?.isSentToEveryone ?? false,
  );

  protected readonly isLoading = computed(() =>
    this.newsletterQuery.isPending(),
  );

  protected readonly isNotFound = computed(
    () => this.newsletterQuery.error()?.code === "GENERIC_NOT_FOUND",
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(() =>
    this.isNotFound() ? undefined : this.newsletterQuery.error()?.code,
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/hirlevel"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const subject = this.subject();

    if (subject) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Hírlevél megtekintése - ${subject}`,
      );
      this.titleService.setTitle(`${subject} - Zephyr Bt.`);
    }
  });
}
