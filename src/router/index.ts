import { route } from "quasar/wrappers";
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from "vue-router";
import routes from "./routes";
import { useAPI } from "src/api";
import { useRedirectStore } from "src/stores/redirectStore";
import { useChangeHistoryStore } from "src/stores/changeHistoryStore";

const api = useAPI();

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === "history" ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
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

  Router.beforeEach((to, from, next) => {
    // console.log("before each. to:", to.name, "from:", from.name);
    const redirectStore = useRedirectStore();
    const changeHistoryStore = useChangeHistoryStore();

    changeHistoryStore.documents = [];

    if (!!to.params.sheet && !(to.meta.sheets as Record<string, any>)?.[to.params.sheet as string]) {
      console.error(`component not registered for sheet '${to.params.sheet}' at route '${to.name?.toString()}'`);
    }

    if (api.isLoggedIn) {
      if (to.name == "login") {
        next({ name: "overview" });
      } else {
        api.setLocalValue?.("currentPath", to.path);
        next();
      }
    } else {
      if (to.meta.noAuth) {
        next();
      } else {
        redirectStore.redirectPath = to.path;
        next({ name: "login" });
      }
    }
  });

  Router.afterEach((to, from) => {
    if (to.name == "login" && !from.meta.noAuth) {
      to.meta.transition = "fade"
    } else if (from.name == "login" && !to.meta.noAuth) {
      to.meta.transition = "fade"
    }
  });

  return Router;
});
