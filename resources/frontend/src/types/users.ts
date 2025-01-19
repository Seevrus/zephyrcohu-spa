export type SessionResponse = {
  data?: SessionData;
};

type SessionData = {
  id: number;
  email: string;
  passwordSetAt: string;
  isAdmin: boolean;
  confirmed: boolean;
  cookiesAccepted: boolean;
  newsLetter: boolean;
};

export type UserSession = Omit<SessionData, "passwordSetAt"> & {
  passwordSetAt: Date;
};
