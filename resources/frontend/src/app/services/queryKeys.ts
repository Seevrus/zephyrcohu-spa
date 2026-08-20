import { type IntegraCategory } from "../../types/integra";

export const mutationKeys = {
  checkRecaptchaToken: ["check_recaptcha_token"],
  deleteProfile: ["delete_profile"],
  downloadIntegraDocument: ["download_integra_document"],
  login: ["login"],
  logout: ["logout"],
  markKnowledgebaseItemAsRead: ["mark_knowledgebase_item_as_read"],
  markNewsItemAsRead: ["mark_news_item_as_read"],
  register: ["register"],
  registerConfirmEmail: ["register_confirm_email"],
  registerResendConfirmationEmail: ["register_resend_confirm_email"],
  registerRevoke: ["register_revoke"],
  requestNewPassword: ["request_new_password"],
  requestOffer: ["request_offer"],
  updateProfile: ["update_profile"],
  updateProfileConfirmEmail: ["update_profile_confirm_email"],
};

export const queryKeys = {
  integra(category?: IntegraCategory) {
    return category ? ["documents", category] : ["documents"];
  },
  knowledgebase(page?: number, tag?: number) {
    const key: (string | number)[] = ["knowledgebase"];

    if (page) {
      key.push(page);
    }
    if (tag) {
      key.push("tag", tag);
    }

    return key;
  },
  knowledgebaseItem(id?: number) {
    return id ? ["knowledgebase_item", id] : ["knowledgebase_item"];
  },
  knowledgebaseTags: ["knowledgebase_tags"],
  links: ["links"],
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
