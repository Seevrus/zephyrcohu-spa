import {
  type AdminTagCollectionResponse,
  type AdminTagResponse,
} from "../../../types/admin-tags";

export function createGetAdminTagsOkResponse(
  data: Partial<AdminTagResponse>[] = [defaultAdminTag],
): AdminTagCollectionResponse {
  return {
    data: data.map((overrides) => ({ ...defaultAdminTag, ...overrides })),
  };
}

const defaultAdminTag: AdminTagResponse = {
  id: 1,
  name: "Test tag",
  count: 0,
};
