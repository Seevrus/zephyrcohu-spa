import { type Tag, type TagsResponse } from "../../types/knowledgebase";

export function createGetKnowledgebaseTagsOkResponse(
  tags: Tag[] = defaultTags,
): TagsResponse {
  return { data: tags };
}

const defaultTags: Tag[] = [
  { id: 1, name: "Billing", count: 5 },
  { id: 2, name: "Onboarding", count: 3 },
  { id: 3, name: "Beta Features", count: 1 },
];
