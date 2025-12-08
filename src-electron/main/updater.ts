import { dialog, ipcMain, shell } from "electron"
import electronUpdater from "electron-updater"
import { setMenuItemEnabled } from "./menu"
import { $i18n } from "./i18n"
import { isMac } from "./helper"
import { reportError } from "../../src/helper/appInfo"
import { formatFileSize } from "../../src/helper/formatter"

/* Based on main documentation at https://www.electron.build/auto-update and several examples:
   - https://github.com/electron-userland/electron-builder/blob/docs-deprecated/encapsulated%20manual%20update%20via%20menu.js
   - https://gist.github.com/iffy/0ff845e8e3f59dbe7eaf2bf24443f104
   - https://github.com/iffy/electron-updater-example
*/

// Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
// It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
const { autoUpdater } = electronUpdater;

let wasInitiatedByUser = true;
let hadMacWritePermissionError = false;

export function setupUpdater() {
    autoUpdater.autoDownload = false;

    ipcMain.on("check-for-updates", (_, isInitiatedByUser: boolean) => {
        void checkForUpdates(isInitiatedByUser);
    })
}

autoUpdater.on("error", (error) => {
    if (wasInitiatedByUser) {
        if (error.toString().includes("ERR_INTERNET_DISCONNECTED")) {
            void dialog.showMessageBox({
                type: "error",
                title: $i18n.t("offlineBanner"),
                message: $i18n.t("ConnectionError"),
                buttons: [$i18n.t("OK")],
                defaultId: 0,
            })
        } else if (isMac && error.message.includes("Cannot update while running on a read-only volume")) {
            // prevent that the error message appears twice
            if (!hadMacWritePermissionError) {
                hadMacWritePermissionError = true;
                void dialog.showMessageBox({
                    title: $i18n.t("cannotUpdateInQuarantineTitle"),
                    message: $i18n.t("moveAppToUpdateMessage"),
                    buttons: [$i18n.t("ok")],
                    defaultId: 0,
                });
            }
        } else {
            void dialog.showMessageBox({
                type: "error",
                title: $i18n.t("GenericErrorTitle"),
                message: $i18n.t("GenericUpdateError"),
                buttons: [$i18n.t("OK"), $i18n.t("reportErrorViaMail")],
                defaultId: 0,
            }).then(value => {
                if (value.response === 1) {
                    void shell.openExternal(reportError(error, "Error while updating"))
                }
            })
        }
    }
    
    setMenuItemEnabled("checkForUpdates", true);
    wasInitiatedByUser = true;
})

autoUpdater.on("update-available", (info) => {
    void dialog.showMessageBox({
        type: "info",
        title: $i18n.t("updateAvailableTitle"),
        message: $i18n.t("updateAvailable", {
            availableVersion: info.version,
            installedVersion: process.env.APP_VERSION,
            downloadSize: info.files[0]?.size
                ? $i18n.t("fileSizeUpdate", { fileSize: formatFileSize(info.files[0].size, $i18n.locale) })
                : undefined
        }),
        buttons: [$i18n.t("Yes"), $i18n.t("remindLaterButton")],
        defaultId: 0,
        cancelId: 1,
    }).then(value => {
        if (value.response === 0) {
            void autoUpdater.downloadUpdate();
        } else {
            setMenuItemEnabled("checkForUpdates", true);
        }
    });
    wasInitiatedByUser = true;
})

autoUpdater.on("update-not-available", () => {
    if (wasInitiatedByUser) {
        void dialog.showMessageBox({
            title: $i18n.t("updateUnavailableTitle"),
            message: $i18n.t("updateUnavailable", {version: process.env.APP_VERSION}),
            buttons: [$i18n.t("OK")],
            defaultId: 0,
            cancelId: 0,
        })
    }

    setMenuItemEnabled("checkForUpdates", true);
    wasInitiatedByUser = true;
})

autoUpdater.on("update-downloaded", () => {
    void dialog.showMessageBox({
        title: $i18n.t("updateDownloadedTitle"),
        message: $i18n.t("updateDownloaded"),
        buttons: [$i18n.t("restartButton"), $i18n.t("laterButton")],
        defaultId: 0,
        cancelId: 1,
    }).then(value => {
        if (value.response === 0) {
            autoUpdater.quitAndInstall()
        }
    })
})

autoUpdater.on("checking-for-update", () => undefined)

autoUpdater.on("download-progress", () => undefined)

export async function checkForUpdates(isInitiatedByUser = true) {
    setMenuItemEnabled("checkForUpdates", false);
    wasInitiatedByUser = isInitiatedByUser;
    hadMacWritePermissionError = false;
    await autoUpdater.checkForUpdates();
}
