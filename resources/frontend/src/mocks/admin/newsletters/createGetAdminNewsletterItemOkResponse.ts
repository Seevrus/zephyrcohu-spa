import {
  type AdminNewsletterItemResponse,
  type AdminNewsletterResponseItem,
} from "../../../types/admin-newsletters";
import { defaultAdminNewsletter } from "./createGetAdminNewslettersOkResponse";

export function createGetAdminNewsletterItemOkResponse(
  overrides: Partial<AdminNewsletterResponseItem> = {},
): AdminNewsletterItemResponse {
  return {
    data: { ...defaultAdminNewsletterItem, ...overrides },
  };
}

const defaultAdminNewsletterItem: AdminNewsletterResponseItem = {
  ...defaultAdminNewsletter,
  content: "<p>Kedves Partnerünk!</p>",
};
