import { Service, signal } from "@angular/core";

import {
  INTEGRA_CATEGORY_LABELS,
  isIntegraCategory,
} from "../../types/integra";

@Service()
export class BreadcrumbService {
  readonly breadcrumb = signal<string | undefined>(undefined);

  setBreadcrumb(title: string) {
    const breadcrumb = BreadcrumbService.breadcrumbsByTitle[title];
    this.breadcrumb.set(breadcrumb ?? title);
  }

  setIntegraBreadcrumb(category: string) {
    const breadcrumb = isIntegraCategory(category)
      ? INTEGRA_CATEGORY_LABELS[category]
      : category;

    this.breadcrumb.set(`Integra - ${breadcrumb}`);
  }

  private static readonly breadcrumbsByTitle: Record<string, string> = {
    Adatmódosítás: "Profil - Adatmódosítás",
    Bejelentkezés: "Bejelentkezés",
    "Elfelejtett jelszó": "Profil - Elfelejtett jelszó",
    "Email cím frissítése": "Profil - Email cím frissítése",
    Főoldal: "Főoldal",
    Hírek: "Hírek",
    "Jelszó helyreállítása": "Profil - Jelszó helyreállítása",
    Regisztráció: "Regisztráció",
    "Regisztráció elvetése": "Regisztráció elvetése",
    "Regisztráció megerősítése": "Regisztráció megerősítése",
  };
}
