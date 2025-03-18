import { defineBoot } from "#q-app/wrappers";
import { getDefaultLocale, loadLangPack, locale } from "./i18n";
import { bus } from "./eventBus";
import { useAccountStore } from "src/stores/accountStore";


export default defineBoot(() => {
  const accountStore = useAccountStore();

  // propagate locale changes
  bus.on("did-change-locale", async (value: string) => {
    locale.value = value;
    await loadLangPack(value);
    window.electronAPI?.didChangeLocale(value);

    accountStore.updateDeviceSettings(settings => 
      settings.locale = value
    ).catch(() => {});
  })

  // initialize locale propagation
  bus.emit("did-change-locale", locale.value);

  // receive locale change from electron menu
  window.electronAPI?.addListener("did-change-locale", (value: string) => {
    if (locale.value != value) {
      bus.emit("did-change-locale", value)
    }
  })

  // get locale from current user's settings
  bus.on("did-login", () => {
    const value = accountStore.account?.settings.locale || getDefaultLocale();

    if (value != locale.value) {
      bus.emit("did-change-locale", value);
    }
  });
  bus.on("did-logout", () => {
    const value = getDefaultLocale();

    if (value != locale.value) {
      bus.emit("did-change-locale", value);
    }
  });
});