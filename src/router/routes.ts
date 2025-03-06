import { RouteRecordRaw } from "vue-router";
import { didExpire } from "src/helper/expiration";

const isOrganisationCreationEnabled = !!process.env.DEV && !didExpire();

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/AuthTransition.vue"),
    children: [
      {
        name: "auth",
        path: "auth",
        component: () => import("pages/LocalAuth.vue"),
        children: [
          {
            name: "login",
            path: "login",
            component: () => import("components/LoginView.vue"),
          },{
            name: "addMemberDevice",
            path: "invitation/:code?",
            component: () => import("components/JoinOrganisationView.vue"),
            beforeEnter: () => !didExpire(),
          },{
            name: "addOrganization",
            path: "create-organization",
            component: () => import("components/AddOrganisationView.vue"),
            beforeEnter: () => isOrganisationCreationEnabled,
          }
        ]
      },
      {
        path: "",
        component: () => import("layouts/MainLayout.vue"),
        children: [
          {
            name: "overview",
            path: "overview", 
            alias: "",
            component: () => import("pages/OverviewPage.vue")
          },
          {
            name: "userContact",
            path: "user/contact",
            component: () => import("pages/UserContactPage.vue"),
            meta: { noScroll: true },
          },{
            name: "userAgreements",
            path: "user/agreements",
            component: () => import("pages/UserAgreementsPage.vue"),
            meta: { noScroll: true },
          },
          {
            name: "userAvailability",
            path: "user/availability",
            component: () => import("pages/UserAvailabilityPage.vue")
          },
          {
            name: "userSettings",
            path: "user/settings",
            component: () => import("pages/UserSettingsPage.vue")
          },
          {
            name: "roster",
            path: "team/roster",
            component: () => import("pages/RosterPage.vue")
          },
          {
            name: "absences",
            path: "team/absences",
            component: () => import("pages/AbsencesPage.vue")
          },
          {
            name: "contacts",
            path: "team/contacts/:memberId?",
            component: () => import("pages/TeamContactPage.vue")
          },
          {
            name: "agreements",
            path: "team/agreements/:memberId?",
            component: () => import("pages/TeamAgreementsPage.vue")
          },
          {
            name: "teamSettings",
            path: "team/settings",
            component: () => import("pages/TeamSettingsPage.vue")
          },
          {
            name: "organizationSettings",
            path: "organization/settings",
            component: () => import("pages/OrganizationSettingsPage.vue")
          },
          {
            name: "organizationMembers",
            path: "organization/members",
            component: () => import("pages/OrganizationMembersPage.vue")
          },
          {
            name: "license",
            path: "license",
            component: () => import("src/pages/LicensePage.vue"),
          },
          {
            name: "acknowledgements",
            path: "acknowledgements",
            component: () => import("src/pages/AcknowledgementsPage.vue"),
          },
          {
            name: "legalNotice",
            path: "legal-notice",
            component: () => import("src/pages/MarkdownPage.vue"),
          },
          {
            name: "privacyPolicy",
            path: "privacy-policy",
            component: () => import("src/pages/MarkdownPage.vue"),
          },
        ]
      }
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
