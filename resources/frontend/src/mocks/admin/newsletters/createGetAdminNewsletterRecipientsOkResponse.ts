import {
  type AdminNewsletterRecipient,
  type AdminNewsletterRecipientCollectionResponse,
} from "../../../types/admin-newsletters";

export function createGetAdminNewsletterRecipientsOkResponse(
  data: Partial<AdminNewsletterRecipient>[] = [defaultAdminNewsletterRecipient],
): AdminNewsletterRecipientCollectionResponse {
  return {
    data: data.map((overrides) => ({
      ...defaultAdminNewsletterRecipient,
      ...overrides,
    })),
  };
}

const defaultAdminNewsletterRecipient: AdminNewsletterRecipient = {
  id: 1,
  email: "user001@example.com",
};
