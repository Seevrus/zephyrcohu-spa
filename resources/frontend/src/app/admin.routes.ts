import { type Routes } from "@angular/router";

export const adminRoutes: Routes = [
  {
    path: "",
    async loadComponent() {
      const { AdminHomeComponent } =
        await import("./pages/admin/home/admin-home.component");
      return AdminHomeComponent;
    },
    title: "Admin",
  },
];
