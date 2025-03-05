import { Platform } from "quasar";

export const appName = process.env.APP_NAME || "";
 
export const appId = process.env.APP_ID || "";

export const appVersion = process.env.APP_VERSION || "0";

export const appBuild = process.env.APP_BUILD || "0";

export const appPlatform = determinePlatform;

export const appCustomURLScheme = process.env.URL_SCHEME || "";

export const appDownloadURL = process.env.INSTALL_URL || "";

export const appUpdateURL = process.env.UPDATE_URL || "";

export const isDemo = false;

export const isDev = !!process.env.DEV;
 
function determinePlatform() {
  if (Platform.is.cordova) {
    if (Platform.is.ios) {
      return "ios";
    } else if (Platform.is.android) {
      return "android";
    }
  } else if (Platform.is.electron) {
    return Platform.is.platform; // e.g. "mac", "win", "linux"
  }

  return "";
}
