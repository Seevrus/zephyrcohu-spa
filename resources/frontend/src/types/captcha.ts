export type CheckRecaptchaTokenRequest = {
  token: string;
};

export type RecaptchaTokenResponse = {
  success: true;
  score: number;
  challenge_ts: string; // ISO format yyyy-MM-dd'T'HH:mm:ssZZ
  hostname: string;
};
