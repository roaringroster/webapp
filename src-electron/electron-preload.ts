/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge } from "electron"
import { ipcRenderer } from "electron"

const secureEventTypes = [
    "did-change-locale",
    "handle-open-url",
] as const
export type SecureEventType = (typeof secureEventTypes)[number]


contextBridge.exposeInMainWorld("electronAPI", {

    didChangeLocale: (locale: string) => 
        ipcRenderer.send("did-change-locale", locale),

    addListener: (event: SecureEventType, handler: (...args: unknown[]) => void) => {
        if (secureEventTypes.includes(event)) {
            ipcRenderer.on(event, (_, ...args) => handler(...args))
            ipcRenderer.send("did-add-listener", event)
        }
    },

    removeListener: (event: SecureEventType, handler: (...args: unknown[]) => void) => {
        if (secureEventTypes.includes(event)) {
            ipcRenderer.off(event, (_, ...args) => handler(...args))
        }
    },

    checkForUpdates: (isInitiatedByUser = true) => 
        ipcRenderer.send("check-for-updates", isInitiatedByUser),
    
})
