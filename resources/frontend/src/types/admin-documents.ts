import { type IntegraCategory } from "./integra";

export type AdminDocumentResponse = {
  id: number;
  category: IntegraCategory;
  displayName: string;
  version: string;
  fileName: string;
  publishedAt: string;
};

export type AdminDocumentItem = Omit<AdminDocumentResponse, "publishedAt"> & {
  publishedAt: Date;
};

export type AdminDocumentCollectionResponse = { data: AdminDocumentResponse[] };
export type AdminDocumentItemResponse = { data: AdminDocumentResponse };

export type SaveAdminDocumentRequest = {
  category: IntegraCategory;
  displayName: string;
  version: string;
  publishedAt: string;
  file?: File;
};
