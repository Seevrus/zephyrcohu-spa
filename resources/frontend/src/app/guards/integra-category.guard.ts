import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";

import { isIntegraCategorySlug } from "../../types/integra";

export const integraCategoryGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  if (isIntegraCategorySlug(route.paramMap.get("kategoria"))) {
    return true;
  }

  return router.parseUrl("/");
};
