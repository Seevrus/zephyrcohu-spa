import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { QueryClient } from "@tanstack/angular-query-experimental";

import { queryKeys } from "../services/queryKeys";
import { UsersQueryService } from "../services/users.query.service";

export const guestGuard: CanActivateFn = async () => {
  const queryClient = inject(QueryClient);
  const router = inject(Router);
  const usersQueryService = inject(UsersQueryService);

  try {
    const session = await queryClient.ensureQueryData({
      queryKey: queryKeys.session,
      queryFn: usersQueryService.session().queryFn,
    });

    if (session) {
      return router.parseUrl("/");
    }

    return true;
  } catch {
    return true;
  }
};
