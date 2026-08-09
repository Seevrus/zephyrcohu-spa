export type OfferResponse = {
  id: number;
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  createdAt: string;
  updatedAt: string;
};

type OfferMetaResponse = {
  count: number;
  total: number;
};

export type OfferItem = Omit<OfferResponse, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
};

export type OfferCollectionResponse = {
  data: OfferResponse[];
  meta: OfferMetaResponse;
};

export type OfferItemResponse = {
  data: OfferResponse;
};

export type OfferCollection = {
  data: OfferItem[];
  meta: OfferMetaResponse;
};
