import { type Routes } from "@angular/router";

import { guestGuard } from "./guards/guest.guard";
import { integraCategoryGuard } from "./guards/integra-category.guard";
import { userGuard } from "./guards/user.guard";

export const routes: Routes = [
  {
    path: "",
    async loadComponent() {
      const { MainComponent } = await import("./pages/main/main.component");
      return MainComponent;
    },
    title: "Főoldal",
  },
  {
    path: "bejelentkezes",
    canActivate: [guestGuard],
    async loadComponent() {
      const { LoginComponent } = await import("./pages/login/login.component");
      return LoginComponent;
    },
    title: "Bejelentkezés",
  },
  {
    path: "ajanlatok",
    async loadComponent() {
      const { OffersComponent } =
        await import("./pages/offers/offers.component");
      return OffersComponent;
    },
    title: "Ajánlatok",
  },
  {
    path: "ajanlatok/:id",
    async loadComponent() {
      const { OfferComponent } = await import("./pages/offer/offer.component");
      return OfferComponent;
    },
    title: "Ajánlatok - ",
  },
  {
    path: "hirek",
    async loadComponent() {
      const { NewsComponent } = await import("./pages/news/news.component");
      return NewsComponent;
    },
    title: "Hírek",
  },
  {
    path: "hirek/:id",
    async loadComponent() {
      const { NewsArticleComponent } =
        await import("./pages/news-article/news-article.component");
      return NewsArticleComponent;
    },
    title: "Hírek - ",
  },
  {
    path: "integra/:kategoria",
    canActivate: [integraCategoryGuard],
    async loadComponent() {
      const { IntegraComponent } =
        await import("./pages/integra/integra.component");
      return IntegraComponent;
    },
    title: "Integra",
  },
  {
    path: "kapcsolat",
    async loadComponent() {
      const { ContactUsComponent } =
        await import("./pages/contact-us/contact-us.component");
      return ContactUsComponent;
    },
  },
  {
    path: "profil",
    canActivate: [userGuard],
    async loadComponent() {
      const { ProfileComponent } =
        await import("./pages/profile/profile.component");
      return ProfileComponent;
    },
    title: "Adatmódosítás",
  },
  {
    path: "profil/elfelejtett_jelszo",
    canActivate: [guestGuard],
    async loadComponent() {
      const { ForgotPasswordComponent } =
        await import("./pages/forgot-password/forgot-password.component");
      return ForgotPasswordComponent;
    },
    title: "Elfelejtett jelszó",
  },
  {
    path: "profil/email_frissit",
    async loadComponent() {
      const { ProfileUpdateEmailComponent } =
        await import("./pages/profile-update-email/profile-update-email.component");
      return ProfileUpdateEmailComponent;
    },
    title: "Email cím frissítése",
  },
  {
    path: "profil/jelszo_helyreallit",
    canActivate: [guestGuard],
    async loadComponent() {
      const { ResetPasswordComponent } =
        await import("./pages/reset-password/reset-password.component");
      return ResetPasswordComponent;
    },
    title: "Jelszó helyreállítása",
  },
  {
    path: "regisztracio",
    canActivate: [guestGuard],
    async loadComponent() {
      const { RegisterComponent } =
        await import("./pages/register/register.component");
      return RegisterComponent;
    },
    title: "Regisztráció",
  },
  {
    path: "regisztracio/elvet",
    canActivate: [guestGuard],
    async loadComponent() {
      const { RegisterMailDeclineComponent } =
        await import("./pages/register-mail-decline/register-mail-decline.component");
      return RegisterMailDeclineComponent;
    },
    title: "Regisztráció elvetése",
  },
  {
    path: "regisztracio/megerosit",
    canActivate: [guestGuard],
    async loadComponent() {
      const { RegisterMailAcceptComponent } =
        await import("./pages/register-mail-accept/register-mail-accept.component");
      return RegisterMailAcceptComponent;
    },
    title: "Regisztráció megerősítése",
  },
  {
    path: "regisztracio_szukseges",
    canActivate: [guestGuard],
    async loadComponent() {
      const { RegisteredOnlyComponent } =
        await import("./pages/registered-only/registered-only.component");
      return RegisteredOnlyComponent;
    },
    title: "Regisztráció szükséges",
  },
  {
    path: "tudasbazis/cikkek",
    async loadComponent() {
      const { KnowledgebaseComponent } =
        await import("./pages/knowledgebase/knowledgebase.component");
      return KnowledgebaseComponent;
    },
    title: "Tudásbázis - Cikkek",
  },
  {
    path: "tudasbazis/cikkek/:id",
    async loadComponent() {
      const { KnowledgebaseArticleComponent } =
        await import("./pages/knowledgebase-article/knowledgebase-article.component");
      return KnowledgebaseArticleComponent;
    },
    title: "Tudásbázis - Cikkek - ",
  },
  {
    path: "tudasbazis/linkek",
    async loadComponent() {
      const { LinksComponent } = await import("./pages/links/links.component");
      return LinksComponent;
    },
    title: "Tudásbázis - Hasznos linkek",
  },
  {
    path: "**",
    async loadComponent() {
      const { NotFoundComponent } =
        await import("./pages/not-found/not-found.component");
      return NotFoundComponent;
    },
    title: "Oldal nem található",
  },
];
