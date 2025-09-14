import { type Routes } from "@angular/router";

export type QueryParamsByPath = {
  "regisztracio/megerosit": {
    code?: string;
    email?: string;
  };
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
