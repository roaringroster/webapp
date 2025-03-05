import { app, BrowserWindow, ipcMain } from "electron"

let mainWindow: BrowserWindow | undefined = undefined;
let initialURL = "";

export function setupDeepLinkHandler(window: BrowserWindow) {
  mainWindow = window;
  // if app was launched by a deeplink on windows or linux, the url is provided as an argument
  initialURL ||= process.argv[1];

  // in case the app was cold launched by an URL
  if (!!initialURL) {
    onAddListener("handle-open-url", () => handleOpenURL(initialURL))
  }
}

function handleOpenURL(url?: string) {
  if (url) {
    initialURL = url;
    mainWindow?.webContents.send("handle-open-url", url);
  }
}

// get notified when a listener was added in renderer process
function onAddListener(eventName: string, callback: () => void) {
  const listener = (_: any, _eventName: string) => {
    if (_eventName == eventName) {
      ipcMain.off("did-add-listener", listener);
      callback();
    }
  }

  ipcMain.on("did-add-listener", listener)
}

// - event handlers, need to be registered before window is ready

// app was focused or launched by a deeplink on macOS only
app.on("open-url", (event, url) => handleOpenURL(url));

// relevant on windows and linux, also triggered by deeplinks
app.on("second-instance", async (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }

  // the commandLine is array of strings in which last element is deep link url
  const url = commandLine.pop();
  handleOpenURL(url);
})
