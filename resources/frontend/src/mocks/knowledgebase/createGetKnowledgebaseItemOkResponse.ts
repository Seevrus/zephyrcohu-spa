import {
  type KnowledgebaseItemResponse,
  type KnowledgebaseResponse,
} from "../../types/knowledgebase";

export function createGetKnowledgebaseItemOkResponse(
  overrides: Partial<KnowledgebaseResponse> = {},
): KnowledgebaseItemResponse {
  return {
    data: {
      id: 1,
      audience: "P",
      isRead: false,
      title: "Test title",
      mainContent: "Test main content",
      additionalContent: null,
      tags: [],
      publishedAt: "2026-02-08T18:25:00.000000Z",
      createdAt: "2026-02-08T18:25:00.000000Z",
      updatedAt: "2026-02-08T18:25:00.000000Z",
      ...overrides,
    },
  };
}
