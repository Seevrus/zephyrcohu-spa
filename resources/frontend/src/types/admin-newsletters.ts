export type AdminNewsletterCollectionResponseItem = {
  id: number;
  subject: string;
  createdAt: string;
  recipientCount: number;
  sentCount: number;
  isSentToEveryone: boolean;
};

export type AdminNewsletterResponseItem =
  AdminNewsletterCollectionResponseItem & {
    content: string;
  };

export type AdminNewsletterCollectionItem = Omit<
  AdminNewsletterCollectionResponseItem,
  "createdAt"
> & {
  createdAt: Date;
};

export type AdminNewsletterItem = Omit<
  AdminNewsletterResponseItem,
  "createdAt"
> & {
  createdAt: Date;
};

export type AdminNewsletterRecipient = {
  id: number;
  email: string;
};

export type SaveAdminNewsletterRequest = {
  subject: string;
  content: string;
};

export type AdminNewsletterCollectionResponse = {
  data: AdminNewsletterCollectionResponseItem[];
};

export type AdminNewsletterRecipientCollectionResponse = {
  data: AdminNewsletterRecipient[];
};

export type AdminNewsletterItemResponse = {
  data: AdminNewsletterResponseItem;
};
