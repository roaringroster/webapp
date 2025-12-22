import { BrowserWindow, ipcMain } from "electron";

let isPrinting = false;

export function setupPrinter() {
  ipcMain.on("print-window", () => {
    if (!isPrinting) {
      isPrinting = true;
      BrowserWindow.getFocusedWindow()?.webContents
        .print({ pageSize: "A4" }, () => isPrinting = false);
    }
  });

  ipcMain.on("print-file", async (_, url: string, title: string) => {
    if (!isPrinting) {
      isPrinting = true;
      const printWindow = new BrowserWindow({
        title,
        show: false,
        webPreferences: {
          contextIsolation: true
        }
      });
      printWindow.webContents.on("did-finish-load", () => {
        setTimeout(() => {
          printWindow.setTitle(title);
          printWindow.webContents.print({}, () => {
            printWindow.close();
            isPrinting = false;
          });
        }, 500)
      });
      await printWindow.loadURL(url);
    }
  });
}