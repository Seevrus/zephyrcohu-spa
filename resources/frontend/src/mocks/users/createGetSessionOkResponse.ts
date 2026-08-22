import { type SessionResponse } from "../../types/users";

export function createGetSessionOkResponse({
  isAdmin = false,
}: { isAdmin?: boolean } = {}): SessionResponse {
  return {
    data: {
      id: 1,
      email: "example@test.com",
      passwordSetAt: "2025-09-07T19:19:07.000000Z",
      isAdmin,
      confirmed: true,
      newsletter: true,
    },
  };
}
