import {
  type AdminLinkCategoryCollectionResponse,
  type AdminLinkCategoryResponse,
} from "../../../types/admin-links";

export function createGetAdminLinkCategoriesOkResponse(
  data: Partial<AdminLinkCategoryResponse>[] = [defaultAdminLinkCategory],
): AdminLinkCategoryCollectionResponse {
  return {
    data: data.map((overrides) => ({
      ...defaultAdminLinkCategory,
      ...overrides,
    })),
  };
}

const defaultAdminLinkCategory: AdminLinkCategoryResponse = {
  id: 1,
  name: "Community",
  linkCount: 1,
};
