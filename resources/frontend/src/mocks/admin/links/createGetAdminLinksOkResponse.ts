import {
  type AdminLinkCollectionResponse,
  type AdminLinkResponse,
} from "../../../types/admin-links";

export function createGetAdminLinksOkResponse(
  data: Partial<AdminLinkResponse>[] = [defaultAdminLink],
): AdminLinkCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultAdminLink, ...overrides })),
  };
}

const defaultAdminLink: AdminLinkResponse = {
  id: 1,
  title: "Test link",
  url: "https://example.com",
  category: { id: 1, name: "Community" },
};
