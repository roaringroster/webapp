import { route } from "quasar/wrappers";
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  Router,
} from "vue-router";
import routes from "./routes";
import { useAccount } from "src/api/local2";
import { useRedirectStore } from "src/stores/redirectStore";
import { useChangeHistoryStore } from "src/stores/changeHistoryStore";
import { appDefaultRoute } from "src/helper/appInfo";

const { isLoggedIn, updateAccount, allUsernames } = useAccount();

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

let router: Router | null = null;

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === "history" ? createWebHistory : createWebHashHistory);

  if (!router) {
    router = createRouter({
      scrollBehavior: (to, from, savedPosition) => {
        if (savedPosition) {
          return savedPosition;
        } else if (to.meta.noScroll && (to.params.memberId == from.params.memberId)) {
          return undefined;
        } else {
          return { left: 0, top: 0 };
        }
      },
      routes,

      // Leave this as is and make changes in quasar.conf.js instead!
      // quasar.conf.js -> build -> vueRouterMode
      // quasar.conf.js -> build -> publicPath
      history: createHistory(
        process.env.MODE === "ssr" ? void 0 : process.env.VUE_ROUTER_BASE
      ),
    });

    router.beforeEach(async (to, from, next) => {
      // console.log("before each. to:", to.name, "from:", from.name);
      const redirectStore = useRedirectStore();
      const changeHistoryStore = useChangeHistoryStore();

      changeHistoryStore.documents = [];

      if (!!to.params.sheet && !(to.meta.sheets as Record<string, any>)?.[to.params.sheet as string]) {
        console.error(`component not registered for sheet '${to.params.sheet}' at route '${to.name?.toString()}'`);
      }

      if (isLoggedIn.value) {
        if (to.matched.find(({ name }) => name == "auth")) {
          next({ name: appDefaultRoute });
        } else {
          updateAccount({currentPath: to.path});
          next();
        }
      } else {
        if (to.name == "auth") {
          const hasAccounts = (await allUsernames()).length > 0;
          next({ name: hasAccounts ? "login" : "addMemberDevice" });
        } else if (!!to.matched.find(({ name }) => name == "auth")) {
          if (to.name == "login" && (await allUsernames()).length == 0) {
            next({ name: "addMemberDevice" })
          } else {
            next();
          }
        } else {
          redirectStore.redirectPath = to.path;
          next({ name: "auth" });
        }
      }
    });

    router.afterEach((to, from) => {
      const fromAuthenticated = !!from.matched.find(({ name }) => name == "auth")
      const toAuthenticated = !!to.matched.find(({ name }) => name == "auth")

      if (!fromAuthenticated && toAuthenticated) {
        to.meta.transition = "fade"
      } else if (fromAuthenticated && !toAuthenticated) {
        to.meta.transition = "fade"
      }
    });

    whenRouterExistsCallbacks.forEach(callback => callback(router!));
  }

  return router;
});

const whenRouterExistsCallbacks: ((router: Router) => void)[] = [];

function addListenerForRouterExists(callback: (router: Router) => void) {
  if (router) {
    callback(router);
  } else {
    whenRouterExistsCallbacks.push(callback)
  }
}

export function whenRouterExists() {
  return new Promise<Router>(resolve => 
    addListenerForRouterExists(router => resolve(router))
  );
}
