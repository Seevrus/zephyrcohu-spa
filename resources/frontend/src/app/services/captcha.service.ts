import { inject, Injectable } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { ReCaptchaV3Service } from "ng-recaptcha-2";
import { lastValueFrom } from "rxjs";

import { CaptchaError } from "../../api/CaptchaError";
import { CaptchaQueryService } from "./captcha.query.service";

type CaptchaAction = "login";

@Injectable({
  providedIn: "root",
})
export class CaptchaService {
  private readonly captchaQueryService = inject(CaptchaQueryService);
  private readonly recaptchaV3Service = inject(ReCaptchaV3Service);

  private readonly checkRecaptchaTokenMutation = injectMutation(() =>
    this.captchaQueryService.checkRecaptchaToken(),
  );

  async executeCaptcha(action: CaptchaAction) {
    const clientToken = await lastValueFrom(
      this.recaptchaV3Service.execute(action),
    );

    const checkTokenResponse =
      await this.checkRecaptchaTokenMutation.mutateAsync({
        token: clientToken,
      });

    if (checkTokenResponse.action !== action) {
      throw new CaptchaError();
    }
  }
}
