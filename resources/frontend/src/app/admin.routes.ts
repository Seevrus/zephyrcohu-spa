import { type Routes } from "@angular/router";

export const adminRoutes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "hirek" },
  {
    path: "ajanlatok",
    async loadComponent() {
      const { AdminOffersComponent } =
        await import("./pages/admin/offers/admin-offers.component");
      return AdminOffersComponent;
    },
    title: "Admin - Ajánlatok",
  },
  {
    path: "ajanlatok/uj",
    async loadComponent() {
      const { AdminOfferFormComponent } =
        await import("./pages/admin/offer-form/admin-offer-form.component");
      return AdminOfferFormComponent;
    },
    title: "Admin - Új ajánlat",
  },
  {
    path: "ajanlatok/:id",
    async loadComponent() {
      const { AdminOfferFormComponent } =
        await import("./pages/admin/offer-form/admin-offer-form.component");
      return AdminOfferFormComponent;
    },
    title: "Admin - Ajánlat szerkesztése",
  },
  {
    path: "hirek",
    async loadComponent() {
      const { AdminNewsComponent } =
        await import("./pages/admin/news/admin-news.component");
      return AdminNewsComponent;
    },
    title: "Admin - Hírek",
  },
  {
    path: "hirek/uj",
    async loadComponent() {
      const { AdminNewsFormComponent } =
        await import("./pages/admin/news-form/admin-news-form.component");
      return AdminNewsFormComponent;
    },
    title: "Admin - Új hír",
  },
  {
    path: "hirek/:id",
    async loadComponent() {
      const { AdminNewsFormComponent } =
        await import("./pages/admin/news-form/admin-news-form.component");
      return AdminNewsFormComponent;
    },
    title: "Admin - Hír szerkesztése",
  },
];
