import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class BreadcrumbService {
  private breadcrumb: string | undefined;
  breadcrumbChanged = new EventEmitter<string | undefined>();

  setBreadCrumb(title: string) {
    this.breadcrumb = this.breadcrumbsByTitle[title];
    this.breadcrumbChanged.emit(this.breadcrumb);
  }

  private readonly breadcrumbsByTitle: Record<string, string> = {
    Főoldal: "Főoldal",
  };
}
