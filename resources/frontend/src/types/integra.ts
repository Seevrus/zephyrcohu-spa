export const INTEGRA_CATEGORIES = {
  tajekoztato: "integra-flyer",
  probaverzio: "integra-trial",
  programfrissites: "integra-update",
  dokumentacio: "integra-documentation",
  egyeb: "integra-other",
} as const;

export type IntegraCategorySlug = keyof typeof INTEGRA_CATEGORIES;

export type IntegraCategory = (typeof INTEGRA_CATEGORIES)[IntegraCategorySlug];

export function isIntegraCategorySlug(value: string | null) {
  return value !== null && Object.keys(INTEGRA_CATEGORIES).includes(value);
}

export type IntegraResponse = {
  id: number;
  category: IntegraCategory;
  displayName: string;
  version: string;
  publishedAt: string;
};

export type IntegraItem = Omit<IntegraResponse, "publishedAt"> & {
  publishedAt: Date;
};

export type IntegraCollectionResponse = {
  data: IntegraResponse[];
};

export type IntegraCollection = {
  data: IntegraItem[];
};
