import {
  type AdminNewsCollectionResponse,
  type AdminNewsResponse,
} from "../../../types/admin-news";

export function createGetAdminNewsOkResponse(
  data: Partial<AdminNewsResponse>[] = [defaultAdminNews],
): AdminNewsCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultAdminNews, ...overrides })),
  };
}

const defaultAdminNews: AdminNewsResponse = {
  id: 1,
  audience: "P",
  title: "Test news",
  mainContent: "Test news main content",
  additionalContent: null,
  publishedAt: "2026-02-08T18:26:00.000000Z",
  createdAt: "2026-02-08T18:26:00.000000Z",
  updatedAt: "2026-02-08T18:26:00.000000Z",
  readerCount: 0,
  readers: [],
};
