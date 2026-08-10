import { type IntegraCategory } from "../../types/integra";

export const mutationKeys = {
  checkRecaptchaToken: ["check_recaptcha_token"],
  deleteProfile: ["delete_profile"],
  login: ["login"],
  logout: ["logout"],
  markNewsItemAsRead: ["mark_news_item_as_read"],
  register: ["register"],
  registerConfirmEmail: ["register_confirm_email"],
  registerResendConfirmationEmail: ["register_resend_confirm_email"],
  registerRevoke: ["register_revoke"],
  requestNewPassword: ["request_new_password"],
  updateProfile: ["update_profile"],
  updateProfileConfirmEmail: ["update_profile_confirm_email"],
};

export const queryKeys = {
  integra(category?: IntegraCategory) {
    return category ? ["documents", category] : ["documents"];
  },
  news(page?: number) {
    return page ? ["news", page] : ["news"];
  },
  newsItem(id?: number) {
    return id ? ["news_item", id] : ["news_item"];
  },
  offers(page?: number) {
    return page ? ["offers", page] : ["offers"];
  },
  offerItem(id?: number) {
    return id ? ["offer_item", id] : ["offer_item"];
  },
  session: ["session"],
};
