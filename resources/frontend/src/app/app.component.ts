import { Component, inject, type OnInit, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CookieService } from "ngx-cookie-service";

import { cookieConsentCookie } from "../constants/cookie";
import { environment } from "../environments/environment";
import { CookieConsentComponent } from "./components/cookie-consent/cookie-consent.component";
import { FooterComponent } from "./footer/footer.component";
import { HeaderComponent } from "./header/header.component";

@Component({
  selector: "app-root",
  imports: [
    CookieConsentComponent,
    FooterComponent,
    HeaderComponent,
    RouterOutlet,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  private readonly cookieService = inject(CookieService);

  protected readonly areCookiesAccepted = signal<boolean | undefined>(
    undefined,
  );

  ngOnInit() {
    this.areCookiesAccepted.set(this.cookieService.check(cookieConsentCookie));
  }

  protected onCookiesAccepted() {
    this.cookieService.set(cookieConsentCookie, "true", {
      expires: 365,
      sameSite: "Lax",
      secure: environment.secureCookies,
    });

    this.areCookiesAccepted.set(true);
  }
}
