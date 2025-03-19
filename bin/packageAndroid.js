import { join } from "path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "fs";
import { exitOnError, runCommand } from "./utils/utils.js";

export default function() {
    if (process.env.npm_lifecycle_event == "device") {
        return;
    }

    exitOnError(() => {
        const __dirname = fileURLToPath(new URL(".", import.meta.url));
        const directory = join(__dirname, "../src-cordova/platforms/android/app/build/outputs/apk/release/");
        
        runCommand(`../node_modules/apk-update/apk-update.js ${directory}app-release.apk ${directory}`);

        const json = JSON.parse(readFileSync(directory + "app-release.json"));
        json.releaseDate = (new Date()).toISOString();

        writeFileSync(directory + "app-release.json", JSON.stringify(json));
    });
}
