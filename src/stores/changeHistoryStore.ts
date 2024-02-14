import { defineStore } from "pinia";
import * as Automerge from "@automerge/automerge";

export const useChangeHistoryStore = defineStore("changeHistory", {
  state: () => ({ documents: [] as NamedDocument[]}),

  getters: { },

  actions: { },
});

export type NamedDocument = {
  document: Automerge.Doc<any>;
  title: string;
};
