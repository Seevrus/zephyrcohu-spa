import {
  type IntegraCollectionResponse,
  type IntegraResponse,
} from "../../types/integra";

export function createGetIntegraDocumentsOkResponse(
  data: Partial<IntegraResponse>[] = [defaultDocument],
): IntegraCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultDocument, ...overrides })),
  };
}

const defaultDocument: IntegraResponse = {
  id: 1,
  category: "integra-flyer",
  displayName: "Test document",
  version: "1.0.0",
  publishedAt: "2026-02-08T18:26:00.000000Z",
};
