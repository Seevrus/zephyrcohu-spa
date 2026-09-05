export type AdminLinkCategory = { id: number; name: string } | null;

export type AdminLinkResponse = {
  id: number;
  title: string;
  url: string;
  category: AdminLinkCategory;
};

export type AdminLinkCollectionResponse = { data: AdminLinkResponse[] };
export type AdminLinkItemResponse = { data: AdminLinkResponse };

export type SaveAdminLinkRequest = {
  title: string;
  url: string;
  categoryName: string | null;
};

export type AdminLinkCategoryResponse = {
  id: number;
  name: string;
  linkCount: number;
};

export type AdminLinkCategoryCollectionResponse = {
  data: AdminLinkCategoryResponse[];
};

export type AdminLinkCategoryItemResponse = { data: AdminLinkCategoryResponse };

export type SaveAdminLinkCategoryRequest = { name: string };
