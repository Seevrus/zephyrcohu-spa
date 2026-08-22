import { Component } from "@angular/core";

@Component({
  selector: "app-admin-home",
  host: {
    class: "app-admin-home",
  },
  template: `
    <div data-testid="admin-home-component">
      <p>Ez az admin felület. Kérlek, ne felejts el kijelentkezni.</p>
    </div>
  `,
  styleUrl: "./admin-home.component.scss",
})
export class AdminHomeComponent {}
