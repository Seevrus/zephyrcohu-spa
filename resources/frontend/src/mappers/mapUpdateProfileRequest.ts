import { type UpdateProfileRequest } from "../types/users";

export function mapUpdateProfileRequest(profile: {
  email: string | null | undefined;
  password: string | null | undefined;
  newsletter: boolean | null | undefined;
}): UpdateProfileRequest {
  return Object.entries(profile).reduce((request, [key, value]) => {
    if (value === null || value === undefined) {
      return request;
    }

    return {
      ...request,
      [key]: value,
    };
  }, {});
}
