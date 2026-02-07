import { inject, Injectable } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { CaptchaQueryService } from "./captcha.query.service";

@Injectable({
  providedIn: "root",
})
export class CaptchaService {
  private readonly captchaQueryService = inject(CaptchaQueryService);

  private readonly checkRecaptchaTokenMutation = injectMutation(() =>
    this.captchaQueryService.checkRecaptchaToken(),
  );

  private static readonly failedCaptchaResponse = {
    success: false,
    score: 0,
  };

  async verifyCaptcha(token: string | null) {
    try {
      if (token) {
        return await this.checkRecaptchaTokenMutation.mutateAsync({ token });
      }

      return CaptchaService.failedCaptchaResponse;
    } catch {
      return CaptchaService.failedCaptchaResponse;
    }
  }
}
