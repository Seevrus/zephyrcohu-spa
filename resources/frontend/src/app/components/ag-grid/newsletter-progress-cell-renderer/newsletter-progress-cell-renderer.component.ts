import { Component, computed, signal } from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";

import { type AdminNewsletterCollectionItem } from "../../../../types/admin-newsletters";

@Component({
  selector: "app-newsletter-progress-cell-renderer",
  imports: [MatProgressBar],
  templateUrl: "./newsletter-progress-cell-renderer.component.html",
  styleUrl: "./newsletter-progress-cell-renderer.component.scss",
})
export class NewsletterProgressCellRendererComponent implements ICellRendererAngularComp {
  private readonly newsletter = signal<
    AdminNewsletterCollectionItem | undefined
  >(undefined);

  protected readonly sentCount = computed(
    () => this.newsletter()?.sentCount ?? 0,
  );

  protected readonly recipientCount = computed(
    () => this.newsletter()?.recipientCount ?? 0,
  );

  protected readonly isSentToEveryone = computed(
    () => this.newsletter()?.isSentToEveryone ?? false,
  );

  protected readonly percentage = computed(() => {
    const recipientCount = this.recipientCount();

    // Edge case: no subscribers when the newsletter was created
    if (recipientCount === 0) {
      return 0;
    }

    return Math.round((this.sentCount() / recipientCount) * 100);
  });

  protected readonly progressLabel = computed(
    () => `Kiküldés: ${this.sentCount()} / ${this.recipientCount()}`,
  );

  agInit(params: ICellRendererParams<AdminNewsletterCollectionItem>): void {
    this.newsletter.set(params.data);
  }

  refresh() {
    return false;
  }
}
