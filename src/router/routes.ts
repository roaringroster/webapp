import { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "login",
        path: "/login",
        component: () => import("pages/LocalAuth.vue"),
        meta: { noAuth: true }
      },
      { 
        name: "start",
        path: "", 
        component: () => import("pages/IndexPage.vue")
      },
      {
        name: "license",
        path: "/license",
        component: () => import("src/pages/LicensePage.vue"),
        meta: { noAuth: true }
      },
      {
        name: "acknowledgements",
        path: "/acknowledgements",
        component: () => import("src/pages/AcknowledgementsPage.vue"),
        meta: { noAuth: true }
      },
      {
        name: "legalNotice",
        path: "/legal-notice",
        component: () => import("src/pages/MarkdownPage.vue"),
        meta: { noAuth: true }
      },
      {
        name: "privacyPolicy",
        path: "/privacy-policy",
        component: () => import("src/pages/MarkdownPage.vue"),
        meta: { noAuth: true }
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
