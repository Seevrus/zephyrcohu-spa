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

export type AdminNewsletterCollectionResponse = {
  data: AdminNewsletterCollectionResponseItem[];
};

export type AdminNewsletterItemResponse = {
  data: AdminNewsletterResponseItem;
};
