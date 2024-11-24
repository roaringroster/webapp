import { boot } from "quasar/wrappers";
import { getDefaultLocale, loadLangPack, locale } from "./i18n";
import { bus } from "./eventBus";
// import { useAPI } from "src/api";
import { useAccount } from "src/api/local2";
// import { UserSettings } from "src/models/user";


export default boot(() => {
  // const api = useAPI();
  const { updateDeviceSettings, getAccountRef } = useAccount();

  // propagate locale changes
  bus.on("did-change-locale", async (value: string) => {
    locale.value = value;
    loadLangPack(value);
    window.electronAPI?.didChangeLocale(value);

    updateDeviceSettings(settings => settings.locale = value).catch(() => {});

    // const user = await api.getCurrentUser().catch(() => undefined);

    // if (user && user.userSettings.locale != value) {
    //   await api.updateDocument<UserSettings>(user.userSettings, {locale: value});
    // }
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
  // bus.on("did-login", ({ userSettings }) => {
  //   const value = userSettings.locale || getDefaultLocale();
  bus.on("did-login", () => {
    const value = getAccountRef().value?.settings.locale || getDefaultLocale();

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