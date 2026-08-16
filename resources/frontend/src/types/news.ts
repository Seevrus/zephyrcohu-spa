export type NewsResponse = {
  id: number;
  audience: "A" | "P";
  isRead?: boolean;
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type NewsMetaResponse = {
  count: number;
  total: number;
};

export type NewsItem = Omit<
  NewsResponse,
  "createdAt" | "publishedAt" | "updatedAt"
> & {
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NewsCollectionResponse = {
  data: NewsResponse[];
  meta: NewsMetaResponse;
};

export type NewsItemResponse = {
  data: NewsResponse;
};

export type NewsCollection = {
  data: NewsItem[];
  meta: NewsMetaResponse;
};
