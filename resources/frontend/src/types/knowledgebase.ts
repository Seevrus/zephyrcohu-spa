export type TagResponse = {
  id: number;
  name: string;
  count?: number;
};

export type Tag = TagResponse & { count: number };

export type KnowledgebaseResponse = {
  id: number;
  audience: "A" | "P";
  isRead?: boolean;
  title: string;
  mainContent: string;
  additionalContent: string | null;
  tags: TagResponse[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type KnowledgebaseMetaResponse = {
  count: number;
  total: number;
};

export type KnowledgebaseItem = Omit<
  KnowledgebaseResponse,
  "createdAt" | "publishedAt" | "updatedAt"
> & {
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgebaseCollectionResponse = {
  data: KnowledgebaseResponse[];
  meta: KnowledgebaseMetaResponse;
};

export type KnowledgebaseItemResponse = {
  data: KnowledgebaseResponse;
};

export type KnowledgebaseCollection = {
  data: KnowledgebaseItem[];
  meta: KnowledgebaseMetaResponse;
};

export type TagsResponse = {
  data: TagResponse[];
};
