export const mutationKeys = {
  checkRecaptchaToken: ["check_recaptcha_token"],
  deleteProfile: ["delete_profile"],
  login: ["login"],
  logout: ["logout"],
  register: ["register"],
  registerConfirmEmail: ["register_confirm_email"],
  registerResendConfirmationEmail: ["register_resend_confirm_email"],
  registerRevoke: ["register_revoke"],
  requestNewPassword: ["request_new_password"],
  updateProfile: ["update_profile"],
  updateProfileConfirmEmail: ["update_profile_confirm_email"],
};

export const queryKeys = {
  news(page?: number) {
    return page ? ["news", page] : ["news"];
  },
  session: ["session"],
};
