import { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "login",
        path: "login",
        component: () => import("pages/LocalAuth.vue"),
        meta: { noAuth: true }
      },
      {
        name: "overview",
        path: "overview", 
        alias: "",
        component: () => import("pages/OverviewPage.vue")
      },
      {
        name: "userData",
        path: "user/data",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "userSettings",
        path: "user/settings",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "roster",
        path: "team/roster",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "absences",
        path: "team/absences",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "teamMembers",
        path: "team/members",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "teamSettings",
        path: "team/settings",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "organizationSettings",
        path: "organization/settings",
        component: () => import("pages/EmptyPage.vue")
      },
      {
        name: "license",
        path: "license",
        component: () => import("src/pages/LicensePage.vue"),
        meta: { noAuth: true }
      },
      {
        name: "acknowledgements",
        path: "acknowledgements",
        component: () => import("src/pages/AcknowledgementsPage.vue"),
        meta: { noAuth: true }
      },
      {
        name: "legalNotice",
        path: "legal-notice",
        component: () => import("src/pages/MarkdownPage.vue"),
        meta: { noAuth: true }
      },
      {
        name: "privacyPolicy",
        path: "privacy-policy",
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
