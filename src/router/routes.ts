import { NavigationGuardNext, RouteLocationNormalized, RouteRecordRaw } from "vue-router";
import * as Automerge from "@automerge/automerge";
// import { IdentifiableType } from "src/models/identifiable";
// import { useAPI } from "src/api";
// import { useChangeHistoryStore } from "src/stores/changeHistoryStore";
import { findOrCreate } from "src/api/repo";
import { createContact } from "src/models/contact";
import { createWorkAgreements } from "src/models/workAgreements";
import { didExpire } from "src/helper/expiration";

// const api = useAPI();

// const getDocument = (getter: () => Promise<Automerge.Doc<IdentifiableType> | undefined>) =>
//   async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
//     const document = await getter();
//     const changeHistoryStore = useChangeHistoryStore();

//     if (document) {
//       const title = to.name?.toString() ?? "";
//       changeHistoryStore.documents = [{document, title}];
//     } else {
//       changeHistoryStore.documents = [];
//     }

//     to.meta.document = document;
//     next();
//   }

const getDocumentUrl = (key: string, initialValue: Automerge.Doc<any>) =>
  async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    to.meta.document = await findOrCreate(key, initialValue);
    next();
  }

const assignDocument = (to: RouteLocationNormalized) => 
  ({ modelValue: to.meta.document });

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
            name: "userData",
            path: "user/data",
            redirect: { name: "userContact" },
            component: () => import("pages/UserDataPage.vue"),
            meta: { noScroll: true },
            children: [
              {
                name: "userContact",
                path: "contact",
                component: () => import("components/ContactView.vue"),
                beforeEnter: getDocumentUrl("demo_user_contact", createContact()),
                props: assignDocument,
                meta: { noScroll: true },
              },{
                name: "userAgreements",
                path: "agreements",
                component: () => import("components/WorkAgreementsView.vue"),
                beforeEnter: getDocumentUrl("demo_user_workagreements", createWorkAgreements()),
                props: assignDocument,
                meta: { noScroll: true },
              }
            ]
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
            path: "team/contacts",
            component: () => import("pages/EmptyPage.vue")
          },
          {
            name: "agreements",
            path: "team/agreements",
            component: () => import("pages/EmptyPage.vue")
          },
          // {
          //   name: "teamMembers",
          //   path: "member/:memberId?",
          //   component: () => import("pages/EmptyPage.vue"),
          //   // component: () => import("pages/TeamMemberPage.vue"),
          //   meta: { noScroll: true },
          //   children: [
              // {
              //   name: "memberContact",
              //   path: "contact",
              //   component: () => import("components/ContactView.vue"),
              //   beforeEnter: getDocument(async () => (await api.getCurrentUser())?.contact),
              //   props: assignDocument,
              //   meta: { noScroll: true },
              // },{
              //   name: "memberAgreements",
              //   path: "agreements",
              //   component: () => import("components/WorkAgreementsView.vue"),
              //   beforeEnter: getDocument(async () => (await api.getCurrentUser())?.workAgreements),
              //   props: assignDocument,
              //   meta: { noScroll: true },
              // }
          //   ]
          // },
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
