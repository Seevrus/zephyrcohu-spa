import { type Routes } from "@angular/router";

export type QueryParamsByPath = {
  "regisztracio/elvet": {
    code?: string;
    email?: string;
  };
  "regisztracio/megerosit": QueryParamsByPath["regisztracio/elvet"];
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
    async loadComponent() {
      const { LoginComponent } = await import("./pages/login/login.component");
      return LoginComponent;
    },
    title: "Bejelentkezés",
  },
  {
    path: "profil/elfelejtett_jelszo",
    async loadComponent() {
      const { ForgotPasswordComponent } = await import(
        "./pages/forgot-password/forgot-password.component"
      );
      return ForgotPasswordComponent;
    },
    title: "Elfelejtett jelszó",
  },
  {
    path: "profil/jelszo_helyreallit",
    async loadComponent() {
      const { ResetPasswordComponent } = await import(
        "./pages/reset-password/reset-password.component"
      );
      return ResetPasswordComponent;
    },
    title: "Jelszó helyreállítása",
  },
  {
    path: "regisztracio",
    async loadComponent() {
      const { RegisterComponent } = await import(
        "./pages/register/register.component"
      );
      return RegisterComponent;
    },
    title: "Regisztráció",
  },
  {
    path: "regisztracio/elvet",
    async loadComponent() {
      const { RegisterMailDeclineComponent } = await import(
        "./pages/register-mail-decline/register-mail-decline.component"
      );
      return RegisterMailDeclineComponent;
    },
    title: "Regisztráció elvetése",
  },
  {
    path: "regisztracio/megerosit",
    async loadComponent() {
      const { RegisterMailAcceptComponent } = await import(
        "./pages/register-mail-accept/register-mail-accept.component"
      );
      return RegisterMailAcceptComponent;
    },
    title: "Regisztráció megerősítése",
  },
];
