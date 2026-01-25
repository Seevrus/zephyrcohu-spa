import { type SessionResponse } from "../../types/users";

export function createUpdateProfileOkResponse({
  email,
  newsletter,
}: {
  email: string;
  newsletter: boolean;
}): SessionResponse {
  return {
    data: {
      id: 1,
      email,
      passwordSetAt: new Date().toISOString(),
      isAdmin: false,
      confirmed: true,
      cookiesAccepted: true,
      newsletter,
    },
  };
}
