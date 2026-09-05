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
  {
    path: "linkek",
    async loadComponent() {
      const { AdminLinksComponent } =
        await import("./pages/admin/links/admin-links.component");
      return AdminLinksComponent;
    },
    title: "Admin - Hasznos linkek",
  },
  {
    path: "linkek/uj",
    async loadComponent() {
      const { AdminLinkFormComponent } =
        await import("./pages/admin/link-form/admin-link-form.component");
      return AdminLinkFormComponent;
    },
    title: "Admin - Új link",
  },
  {
    path: "linkek/:id",
    async loadComponent() {
      const { AdminLinkFormComponent } =
        await import("./pages/admin/link-form/admin-link-form.component");
      return AdminLinkFormComponent;
    },
    title: "Admin - Link szerkesztése",
  },
  {
    path: "tudasbazis",
    async loadComponent() {
      const { AdminKnowledgebaseComponent } =
        await import("./pages/admin/knowledgebase/admin-knowledgebase.component");
      return AdminKnowledgebaseComponent;
    },
    title: "Admin - Tudásbázis",
  },
  {
    path: "tudasbazis/cimkek",
    async loadComponent() {
      const { AdminTagsComponent } =
        await import("./pages/admin/tags/admin-tags.component");
      return AdminTagsComponent;
    },
    title: "Admin - Tudásbázis címkék",
  },
  {
    path: "tudasbazis/uj",
    async loadComponent() {
      const { AdminKnowledgebaseFormComponent } =
        await import("./pages/admin/knowledgebase-form/admin-knowledgebase-form.component");
      return AdminKnowledgebaseFormComponent;
    },
    title: "Admin - Új tudásbázis cikk",
  },
  {
    path: "tudasbazis/:id",
    async loadComponent() {
      const { AdminKnowledgebaseFormComponent } =
        await import("./pages/admin/knowledgebase-form/admin-knowledgebase-form.component");
      return AdminKnowledgebaseFormComponent;
    },
    title: "Admin - Tudásbázis cikk szerkesztése",
  },
];
