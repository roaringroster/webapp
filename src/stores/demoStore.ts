import { defineStore } from "pinia";

export const useDemoStore = defineStore("demo", {
  state: () => ({ 
    docs: {} as Record<string, any>,
  }),

  getters: { },

  actions: { },
});
