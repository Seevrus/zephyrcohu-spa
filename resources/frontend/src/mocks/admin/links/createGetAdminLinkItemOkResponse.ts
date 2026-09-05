import {
  type AdminLinkItemResponse,
  type AdminLinkResponse,
} from "../../../types/admin-links";

export function createGetAdminLinkItemOkResponse(
  overrides: Partial<AdminLinkResponse> = {},
): AdminLinkItemResponse {
  return {
    data: { ...defaultAdminLink, ...overrides },
  };
}

const defaultAdminLink: AdminLinkResponse = {
  id: 1,
  title: "Test link",
  url: "https://example.com",
  category: { id: 1, name: "Community" },
};
