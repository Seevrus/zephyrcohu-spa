import {
  type AdminUserItemResponse,
  type AdminUserResponse,
} from "../../../types/admin-users";
import { defaultAdminUser } from "./createGetAdminUsersOkResponse";

export function createAdminUserItemOkResponse(
  overrides: Partial<AdminUserResponse> = {},
): AdminUserItemResponse {
  return {
    data: { ...defaultAdminUser, ...overrides },
  };
}
