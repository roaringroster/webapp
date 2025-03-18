import { EventBus } from "quasar";
import { defineBoot } from "#q-app/wrappers";
// import { Contact } from "src/models/contact";
// import { User, UserSettings } from "src/models/user";

declare module "vue" {
    interface ComponentCustomProperties {
        $bus: EventBus;
    }
}

export type UpdateInfo = {
    installedVersion: string;
}
export type UpdateAvailableInfo = UpdateInfo & {
    availableVersion: string;
    downloadSize?: number;
    storeUrl?: string;
    downloadUrls?: string[];
}

const bus = new EventBus<{
  "did-change-locale": (locale: string) => void;
  "update-available": (updateInfo: UpdateAvailableInfo) => void;
  "update-unavailable": (updateInfo: UpdateInfo) => void;
  // "did-login": (userData: {user: User, userSettings: UserSettings, contact: Contact}) => void;
  "did-login": () => void;
  "did-logout": () => void;
  "did-debug": (value: any) => void;
  "toggle-drawer": () => void;
  "open-drawer": () => void;
  "close-drawer": () => void;
}>();

export default defineBoot(({ app }) => {
  // for Options API
  app.config.globalProperties.$bus = bus

  // for Composition API
  app.provide("bus", bus)
})

export { bus };
