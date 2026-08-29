import {
  type AdminKnowledgebaseItemResponse,
  type AdminKnowledgebaseResponse,
} from "../../../types/admin-knowledgebase";

export function createGetAdminKnowledgebaseItemOkResponse(
  overrides: Partial<AdminKnowledgebaseResponse> = {},
): AdminKnowledgebaseItemResponse {
  return {
    data: { ...defaultAdminKnowledgebase, ...overrides },
  };
}

const defaultAdminKnowledgebase: AdminKnowledgebaseResponse = {
  id: 1,
  audience: "P",
  title: "Test knowledgebase article",
  mainContent: "Test knowledgebase main content",
  additionalContent: null,
  tags: [],
  publishedAt: "2026-02-08T18:26:00.000000Z",
  createdAt: "2026-02-08T18:26:00.000000Z",
  updatedAt: "2026-02-08T18:26:00.000000Z",
  readerCount: 0,
  readers: [],
};
