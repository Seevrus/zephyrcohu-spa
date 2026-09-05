import {
  type AdminDocumentCollectionResponse,
  type AdminDocumentResponse,
} from "../../../types/admin-documents";

export function createGetAdminDocumentsOkResponse(
  data: Partial<AdminDocumentResponse>[] = [defaultAdminDocument],
): AdminDocumentCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultAdminDocument, ...overrides })),
  };
}

export const defaultAdminDocument: AdminDocumentResponse = {
  id: 1,
  category: "tajekoztato",
  displayName: "Tájékoztató 2026",
  version: "2.0",
  fileName: "flyer-2026.pdf",
  publishedAt: "2026-02-10T00:00:00.000000Z",
};
