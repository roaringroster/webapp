import { defineStore } from "pinia";
import { RouteLocationRaw } from "vue-router";
// import { useAPI } from "src/api";
import { useAccount } from "src/api/local2";
import { appDefaultRoute } from "src/helper/appInfo";


export const useRedirectStore = defineStore("redirect", {
  state: () => ({ redirectPath: "" }),

  getters: { },

  actions: {
    locationAfterLogin(): RouteLocationRaw {
      const path = this.redirectPath;
      this.redirectPath = "";

      return path 
        // || await useAPI().getLocalValue<string>("currentPath") 
        || useAccount().getAccountRef().value?.currentPath
        || { name: appDefaultRoute };
    },
  },
});
