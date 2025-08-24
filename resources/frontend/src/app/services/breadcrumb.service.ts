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
    Bejelentkezés: "Bejelentkezés",
    Főoldal: "Főoldal",
    Regisztráció: "Regisztráció",
  };
}
