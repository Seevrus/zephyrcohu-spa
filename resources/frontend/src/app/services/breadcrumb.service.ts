import { Service, signal } from "@angular/core";

@Service()
export class BreadcrumbService {
  readonly breadcrumb = signal<string | undefined>(undefined);

  setBreadcrumb(title: string) {
    const breadcrumb = BreadcrumbService.breadcrumbsByTitle[title];
    this.breadcrumb.set(breadcrumb ?? title);
  }

  setIntegraBreadcrumb(category: string) {
    const breadcrumb = BreadcrumbService.integraCategories[category];
    this.breadcrumb.set(`Integra - ${breadcrumb ?? category}`);
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

  private static readonly integraCategories: Record<string, string> = {
    tajekoztato: "Tájékoztató",
    probaverzio: "Próbaverzió",
    programfrissites: "Programfrissítés",
    dokumentacio: "Dokumentáció",
    egyeb: "Egyéb",
  };
}
