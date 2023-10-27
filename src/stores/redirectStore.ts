import { defineStore } from "pinia";
import { useAPI } from "src/api";
import { RouteLocationRaw } from "vue-router";


export const useRedirectStore = defineStore("redirect", {
  state: () => ({ redirectPath: "" }),

  getters: { },

  actions: {
    async locationAfterLogin(): Promise<RouteLocationRaw> {
      const path = this.redirectPath;
      this.redirectPath = "";

      return path 
        || await useAPI().getLocalValue<string>("currentPath") 
        || { name: "overview" };
    },
  },
});
