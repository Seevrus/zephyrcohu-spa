import { type NewsItemResponse, type NewsResponse } from "../../types/news";

export function createGetNewsItemOkResponse(
  overrides: Partial<NewsResponse> = {},
): NewsItemResponse {
  return {
    data: {
      id: 1,
      audience: "P",
      isRead: false,
      title: "Test title",
      mainContent: "Test main content",
      additionalContent: null,
      createdAt: "2026-02-08T18:25:00.000000Z",
      updatedAt: "2026-02-08T18:25:00.000000Z",
      ...overrides,
    },
  };
}
