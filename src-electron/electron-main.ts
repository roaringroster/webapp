import { app, BrowserWindow, nativeTheme } from "electron"
import path from "path"
import { unlinkSync } from "fs"
import { platform, isMac } from "./main/helper"
import { handlePermissionRequests } from "./main/security"
import { setupI18n } from "./main/i18n"
import { setupAppMenu, setMenuItemEnabled } from "./main/menu"
import { createWindow } from "./main/window"
import { setupUpdater } from "./main/updater"
import { setupDeepLinkHandler } from "./main/deeplink"

// workaround for DevTools on Windows with dark mode
try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    unlinkSync(path.join(app.getPath("userData"), "DevTools Extensions"))
  }
} catch { }

const urlScheme = process.env.URL_SCHEME;

// register custom url scheme
if (urlScheme) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(
        urlScheme, 
        process.execPath, 
        [path.resolve(process.argv[1])]
      );
    }
  } else {
    app.setAsDefaultProtocolClient(urlScheme);
  }
}

// relevant on windows and linux to prevent multiple app instances running in parallel
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

const mainWindowPromise = app.whenReady()
  .then(handlePermissionRequests)
  .then(setupI18n)
  .then(setupAppMenu)
  .then(setupUpdater)
  .then(createWindow)
  .then(setupDeepLinkHandler)

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit()
  } else {
    setMenuItemEnabled("print", false)
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
