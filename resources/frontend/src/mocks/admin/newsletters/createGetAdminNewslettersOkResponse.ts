import {
  type AdminNewsletterCollectionResponse,
  type AdminNewsletterCollectionResponseItem,
} from "../../../types/admin-newsletters";

export function createGetAdminNewslettersOkResponse(
  data: Partial<AdminNewsletterCollectionResponseItem>[] = [
    defaultAdminNewsletter,
  ],
): AdminNewsletterCollectionResponse {
  return {
    data: data.map((overrides) => ({
      ...defaultAdminNewsletter,
      ...overrides,
    })),
  };
}

export const defaultAdminNewsletter: AdminNewsletterCollectionResponseItem = {
  id: 1,
  subject: "Zephyr hírlevél 2026 február",
  createdAt: "2026-02-10T00:00:00.000000Z",
  recipientCount: 120,
  sentCount: 118,
  isSentToEveryone: false,
};
