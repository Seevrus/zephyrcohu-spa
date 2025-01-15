import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class BreadcrumbService {
  breadcrumbChanged = new EventEmitter<string | undefined>();

  setBreadcrumb(title: string) {
    const breadcrumb = this.breadcrumbsByTitle[title];
    this.breadcrumbChanged.emit(breadcrumb);
  }

  private readonly breadcrumbsByTitle: Record<string, string> = {
    Bejelentkezés: "Bejelentkezés",
    Főoldal: "Főoldal",
    Regisztráció: "Regisztráció",
  };
}
