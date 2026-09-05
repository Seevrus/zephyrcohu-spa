import {
  type AdminDocumentItemResponse,
  type AdminDocumentResponse,
} from "../../../types/admin-documents";
import { defaultAdminDocument } from "./createGetAdminDocumentsOkResponse";

export function createGetAdminDocumentItemOkResponse(
  overrides: Partial<AdminDocumentResponse> = {},
): AdminDocumentItemResponse {
  return {
    data: { ...defaultAdminDocument, ...overrides },
  };
}
