import { type IntegraCategory } from "../../types/integra";

export const mutationKeys = {
  checkRecaptchaToken: ["check_recaptcha_token"],
  createAdminKnowledgebase: ["create_admin_knowledgebase"],
  createAdminLink: ["create_admin_link"],
  createAdminNews: ["create_admin_news"],
  createAdminOffer: ["create_admin_offer"],
  deleteAdminKnowledgebase: ["delete_admin_knowledgebase"],
  deleteAdminLink: ["delete_admin_link"],
  deleteAdminNews: ["delete_admin_news"],
  deleteAdminLinkCategory: ["delete_admin_link_category"],
  deleteAdminOffer: ["delete_admin_offer"],
  deleteAdminTag: ["delete_admin_tag"],
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
  updateAdminKnowledgebase: ["update_admin_knowledgebase"],
  updateAdminLink: ["update_admin_link"],
  updateAdminLinkCategory: ["update_admin_link_category"],
  updateAdminNews: ["update_admin_news"],
  updateAdminOffer: ["update_admin_offer"],
  updateAdminTag: ["update_admin_tag"],
  updateProfile: ["update_profile"],
  updateProfileConfirmEmail: ["update_profile_confirm_email"],
};

export const queryKeys = {
  adminKnowledgebase: ["admin_knowledgebase"],
  adminKnowledgebaseItem(id?: number) {
    return id ? ["admin_knowledgebase_item", id] : ["admin_knowledgebase_item"];
  },
  adminLinkCategories: ["admin_link_categories"],
  adminLinks: ["admin_links"],
  adminLinkItem(id?: number) {
    return id ? ["admin_link_item", id] : ["admin_link_item"];
  },
  adminNews: ["admin_news"],
  adminNewsItem(id?: number) {
    return id ? ["admin_news_item", id] : ["admin_news_item"];
  },
  adminOffers: ["admin_offers"],
  adminOfferItem(id?: number) {
    return id ? ["admin_offer_item", id] : ["admin_offer_item"];
  },
  adminTags: ["admin_tags"],
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
