import { Component, computed, inject, signal } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";

import type { IntegraItem } from "../../../../types/integra";
import { IntegraQueryService } from "../../../services/integra.query.service";

@Component({
  selector: "app-integra-document-link-cell-renderer",
  templateUrl: "./integra-document-link-cell-renderer.component.html",
})
export class IntegraDocumentLinkCellRendererComponent implements ICellRendererAngularComp {
  private readonly integraQueryService = inject(IntegraQueryService);

  private readonly downloadMutation = injectMutation(() =>
    this.integraQueryService.downloadIntegraDocument(),
  );

  private readonly document = signal<IntegraItem | undefined>(undefined);

  protected readonly displayName = computed(
    () => this.document()?.displayName ?? "",
  );

  agInit(params: ICellRendererParams<IntegraItem>): void {
    this.document.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  protected onDownload(): void {
    const document = this.document();

    if (document) {
      this.downloadMutation.mutate(document.id);
    }
  }
}
