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
      
      try {
        await printWindow.loadURL(url);
        await delay(500);
        printWindow.setTitle(title);
        printWindow.webContents.print({}, () => {
          isPrinting = false;
          printWindow.close();
        });
      } catch (error) {
        console.error("error while preparing to print:", error);
        isPrinting = false;
        printWindow.close();
      }
    }
  });
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
