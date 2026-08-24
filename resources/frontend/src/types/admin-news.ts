export type AdminNewsResponse = {
  id: number;
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  readerCount: number;
  readers: string[];
};

export type AdminNewsItem = Omit<
  AdminNewsResponse,
  "publishedAt" | "createdAt" | "updatedAt"
> & {
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminNewsCollectionResponse = { data: AdminNewsResponse[] };
export type AdminNewsItemResponse = { data: AdminNewsResponse };

export type SaveAdminNewsRequest = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
};
