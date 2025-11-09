export type ConfirmOrRevokeEmailRequest = {
  code: string;
  email: string;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  cookiesAccepted: boolean;
  newsletter: boolean;
};

export type RequestNewPasswordRequest = {
  email: string;
};

export type ResendRegistrationEmailRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  code: string;
  email: string;
  password: string;
};

export type SessionResponse<D extends SessionData | null = SessionData> = {
  data: D;
};

export type SessionData = {
  id: number;
  email: string;
  passwordSetAt: string;
  isAdmin: boolean;
  confirmed: boolean;
  cookiesAccepted: boolean;
  newsletter: boolean;
};

export type UserSession = Omit<SessionData, "passwordSetAt"> & {
  passwordSetAt: Date;
};
