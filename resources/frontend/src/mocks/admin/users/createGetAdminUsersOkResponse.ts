import {
  type AdminUserCollectionResponse,
  type AdminUserResponse,
} from "../../../types/admin-users";

export function createGetAdminUsersOkResponse(
  data: Partial<AdminUserResponse>[] = [defaultAdminUser],
): AdminUserCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultAdminUser, ...overrides })),
  };
}

const defaultAdminUser: AdminUserResponse = {
  id: 1,
  email: "user001@example.com",
  confirmed: true,
  newsletter: false,
  isAdmin: false,
  passwordSetAt: "2026-01-15T00:00:00.000000Z",
  lastActive: "2026-02-10T00:00:00.000000Z",
};
