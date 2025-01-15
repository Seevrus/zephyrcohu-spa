import { type Routes } from "@angular/router";

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
];
