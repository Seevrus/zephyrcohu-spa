import { type TagResponse } from "./knowledgebase";

export type AdminKnowledgebaseResponse = {
  id: number;
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  tags: TagResponse[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  readerCount: number;
  readers: string[];
};

export type AdminKnowledgebaseItem = Omit<
  AdminKnowledgebaseResponse,
  "publishedAt" | "createdAt" | "updatedAt"
> & {
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminKnowledgebaseCollectionResponse = {
  data: AdminKnowledgebaseResponse[];
};
export type AdminKnowledgebaseItemResponse = {
  data: AdminKnowledgebaseResponse;
};

export type SaveAdminKnowledgebaseRequest = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
  tags: string[];
};
