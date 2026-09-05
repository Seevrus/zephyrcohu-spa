/**
 * The API, the SPA route (`/integra/{kategoria}`) and the storage directory all
 * use the same Hungarian slug, so there is no slug-to-category mapping to do.
 */
export const INTEGRA_CATEGORIES = [
  "tajekoztato",
  "probaverzio",
  "programfrissites",
  "dokumentacio",
  "egyeb",
] as const;

export type IntegraCategory = (typeof INTEGRA_CATEGORIES)[number];

export const INTEGRA_CATEGORY_LABELS: Record<IntegraCategory, string> = {
  tajekoztato: "Tájékoztató",
  probaverzio: "Próbaverzió",
  programfrissites: "Programfrissítés",
  dokumentacio: "Dokumentáció",
  egyeb: "Egyéb",
};

export function isIntegraCategory(
  value: string | null,
): value is IntegraCategory {
  return (
    value !== null && INTEGRA_CATEGORIES.includes(value as IntegraCategory)
  );
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
