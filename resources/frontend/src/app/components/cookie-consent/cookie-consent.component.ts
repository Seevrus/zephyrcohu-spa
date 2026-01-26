import {
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  output,
  Renderer2,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardTitle,
} from "@angular/material/card";

@Component({
  selector: "app-cookie-consent",
  host: {
    class: "app-cookie-consent",
  },
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardFooter,
    MatCardHeader,
    MatCardTitle,
  ],
  templateUrl: "./cookie-consent.component.html",
  styleUrl: "./cookie-consent.component.scss",
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  readonly cookiesAccepted = output<void>();

  private readonly renderer = inject(Renderer2);

  ngOnInit() {
    this.renderer.addClass(document.body, "cookie-consent-open");
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, "cookie-consent-open");
  }

  protected accept() {
    this.cookiesAccepted.emit();
  }
}
