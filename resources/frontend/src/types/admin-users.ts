export type AdminUserResponse = {
  id: number;
  email: string;
  confirmed: boolean;
  newsletter: boolean;
  isAdmin: boolean;
  passwordSetAt: string;
  lastActive: string | null;
};

export type AdminUser = Omit<
  AdminUserResponse,
  "passwordSetAt" | "lastActive"
> & {
  passwordSetAt: Date;
  lastActive: Date | null;
};

export type AdminUserCollectionResponse = { data: AdminUserResponse[] };
