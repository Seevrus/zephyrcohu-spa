import {
  type AdminOfferCollectionResponse,
  type AdminOfferResponse,
} from "../../../types/admin-offers";

export function createGetAdminOffersOkResponse(
  data: Partial<AdminOfferResponse>[] = [defaultAdminOffer],
): AdminOfferCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultAdminOffer, ...overrides })),
  };
}

const defaultAdminOffer: AdminOfferResponse = {
  id: 1,
  audience: "P",
  title: "Test offer",
  mainContent: "Test offer main content",
  additionalContent: null,
  publishedAt: "2026-02-08T18:26:00.000000Z",
  createdAt: "2026-02-08T18:26:00.000000Z",
  updatedAt: "2026-02-08T18:26:00.000000Z",
};
