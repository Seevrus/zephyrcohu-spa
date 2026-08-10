import { Component, computed, inject, input } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import {
  INTEGRA_CATEGORIES,
  type IntegraCategorySlug,
} from "../../../types/integra";
import { IntegraQueryService } from "../../services/integra.query.service";

@Component({
  selector: "app-integra",
  host: {
    class: "app-integra",
  },
  imports: [],
  templateUrl: "./integra.component.html",
  styleUrl: "./integra.component.scss",
})
export class IntegraComponent {
  private readonly integraQueryService = inject(IntegraQueryService);

  readonly kategoria = input<IntegraCategorySlug>();

  private readonly category = computed(() => {
    const slug = this.kategoria();
    return slug ? INTEGRA_CATEGORIES[slug] : undefined;
  });

  private readonly integraDocumentsQuery = injectQuery(() =>
    this.integraQueryService.getIntegraDocuments(this.category()),
  );

  protected readonly documents = computed(
    () => this.integraDocumentsQuery.data()?.data ?? [],
  );
}
