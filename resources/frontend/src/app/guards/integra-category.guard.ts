import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";

import { isIntegraCategory } from "../../types/integra";

export const integraCategoryGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  if (isIntegraCategory(route.paramMap.get("kategoria"))) {
    return true;
  }

  return router.parseUrl("/");
};
