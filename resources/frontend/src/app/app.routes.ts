import { type Routes } from "@angular/router";

import { guestGuard } from "./guards/guest.guard";
import { userGuard } from "./guards/user.guard";

export type QueryParamsByPath = {
  "profil/jelszo_helyreallit": {
    code?: string;
    email?: string;
  };
  "regisztracio/elvet": QueryParamsByPath["profil/jelszo_helyreallit"];
  "regisztracio/megerosit": QueryParamsByPath["profil/jelszo_helyreallit"];
};

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
    path: "**",
    async loadComponent() {
      const { NotFoundComponent } =
        await import("./pages/not-found/not-found.component");
      return NotFoundComponent;
    },
    title: "Oldal nem található",
  },
];
