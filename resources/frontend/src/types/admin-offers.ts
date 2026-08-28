import { type OfferResponse } from "./offers";

export type AdminOfferResponse = OfferResponse;

export type AdminOfferItem = Omit<
  AdminOfferResponse,
  "publishedAt" | "createdAt" | "updatedAt"
> & {
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminOfferCollectionResponse = { data: AdminOfferResponse[] };
export type AdminOfferItemResponse = { data: AdminOfferResponse };

export type SaveAdminOfferRequest = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
};
