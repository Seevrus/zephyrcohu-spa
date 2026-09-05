import { Component, computed, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";

import type { AdminLinkResponse } from "../../../../types/admin-links";

@Component({
  selector: "app-link-url-cell-renderer",
  templateUrl: "./link-url-cell-renderer.component.html",
})
export class LinkUrlCellRendererComponent implements ICellRendererAngularComp {
  private readonly link = signal<AdminLinkResponse | undefined>(undefined);

  protected readonly url = computed(() => this.link()?.url ?? "");

  agInit(params: ICellRendererParams<AdminLinkResponse>): void {
    this.link.set(params.data);
  }

  refresh(): boolean {
    return false;
  }
}
