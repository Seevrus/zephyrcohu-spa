import { type OfferItemResponse, type OfferResponse } from "../../types/offers";

export function createGetOfferItemOkResponse(
  overrides: Partial<OfferResponse> = {},
): OfferItemResponse {
  return {
    data: {
      id: 1,
      audience: "P",
      title: "Test title",
      mainContent: "Test main content",
      additionalContent: null,
      publishedAt: "2026-02-08T18:25:00.000000Z",
      createdAt: "2026-02-08T18:25:00.000000Z",
      updatedAt: "2026-02-08T18:25:00.000000Z",
      ...overrides,
    },
  };
}
