import { inject } from "@angular/core";
import { type CanMatchFn } from "@angular/router";
import { QueryClient } from "@tanstack/angular-query-experimental";

import { queryKeys } from "../services/queryKeys";
import { UsersQueryService } from "../services/users.query.service";

export const adminGuard: CanMatchFn = async () => {
  const queryClient = inject(QueryClient);
  const usersQueryService = inject(UsersQueryService);

  try {
    const session = await queryClient.ensureQueryData({
      queryKey: queryKeys.session,
      queryFn: usersQueryService.session().queryFn,
    });

    return session?.isAdmin === true;
  } catch {
    return false;
  }
};
