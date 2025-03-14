import type { Composer } from "vue-i18n";
import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import { QVueGlobals } from "quasar";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: Composer["t"];
    $tm: Composer["tm"];
    $d: Composer["d"];
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
    $q: QVueGlobals;
  }
}
