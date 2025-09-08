import { BrowserWindow } from "electron"
import path from "path"
import { fileURLToPath } from "node:url"
import { isMac } from "./helper"
import { setMenuItemEnabled } from "./menu"
import windowStateKeeper from "electron-window-state"

const currentDir = fileURLToPath(new URL('.', import.meta.url))

export async function createWindow() {
    const mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 768
    })
    const window = new BrowserWindow({
        icon: path.resolve(currentDir, "icons/icon.png"), // tray icon
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 320,
        minHeight: 480,
        useContentSize: true,
        webPreferences: {
            contextIsolation: true,
            // More info: /quasar-cli/developing-electron-apps/electron-preload-script
            preload: path.resolve(currentDir, path.join(process.env.QUASAR_ELECTRON_PRELOAD_FOLDER || "", "electron-preload" + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION)),
        },
        titleBarStyle: isMac ? "hidden" : "default",
        // titleBarOverlay: {
        //   color: "#1976D2",
        //   symbolColor: "#ffffff",
        // },
    })
    mainWindowState.manage(window)

    if (process.env.DEV) {
        await window.loadURL(process.env.APP_URL)
    } else {
        await window.loadFile("index.html")
    }
    setMenuItemEnabled("print", true)

    if (process.env.DEBUGGING) {
        // if on DEV or Production with debug enabled
        window.webContents.openDevTools()
    } else {
        // we're on production; no access to devtools pls
        window.webContents.on("devtools-opened", () => {
            window.webContents.closeDevTools()
        })
    }

    // disable devtools shortcuts in production and enable them with debug
    window.webContents.on("before-input-event", (event, input) => {
        if (input.code == "KeyI" && ((!isMac && input.control && input.shift) || (isMac && input.alt && input.meta))) {
            if (process.env.DEBUGGING) {
                if (!window.webContents.isDevToolsOpened()) {
                    window.webContents.openDevTools()
                } else {
                    window.webContents.closeDevTools()
                }
            } else {
                event.preventDefault()
            }
        }
    })

    return window
}