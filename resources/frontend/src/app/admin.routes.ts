import { type Routes } from "@angular/router";

export const adminRoutes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "hirek" },
  {
    path: "hirek",
    async loadComponent() {
      const { AdminNewsComponent } =
        await import("./pages/admin/news/admin-news.component");
      return AdminNewsComponent;
    },
    title: "Admin - Hírek",
  },
];
