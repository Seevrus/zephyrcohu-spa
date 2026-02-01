import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class BreadcrumbService {
  readonly breadcrumb = signal<string | undefined>(undefined);

  setBreadcrumb(title: string) {
    const breadcrumb = BreadcrumbService.breadcrumbsByTitle[title];
    this.breadcrumb.set(breadcrumb);
  }

  private static readonly breadcrumbsByTitle: Record<string, string> = {
    Adatmódosítás: "Profil - Adatmódosítás",
    Bejelentkezés: "Bejelentkezés",
    "Elfelejtett jelszó": "Profil - Elfelejtett jelszó",
    "Email cím frissítése": "Profil - Email cím frissítése",
    Főoldal: "Főoldal",
    "Jelszó helyreállítása": "Profil - Jelszó helyreállítása",
    Regisztráció: "Regisztráció",
    "Regisztráció elvetése": "Regisztráció elvetése",
    "Regisztráció megerősítése": "Regisztráció megerősítése",
  };
}
