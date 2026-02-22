type NewsResponse = {
  id: number;
  audience: "A" | "P";
  isRead?: boolean;
  title: string;
  mainContent: string;
  additionalContent: string | null;
  createdAt: string;
  updatedAt: string;
};

type NewsMetaResponse = {
  count: number;
  total: number;
};

type News = Omit<NewsResponse, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
};

export type NewsCollectionResponse = {
  data: NewsResponse[];
  meta: NewsMetaResponse;
};

export type NewsCollection = {
  data: News[];
  meta: NewsMetaResponse;
};
