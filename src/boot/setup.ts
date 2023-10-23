import { boot } from "quasar/wrappers";
import { Platform } from "quasar";
import { bus } from "src/boot/eventBus";

export default boot(({ store }) => {
    document.body.classList.add("platform-" + Platform.is.platform);

    if ((process.env.DEV as unknown) === true || process.env.DEV === "true") {
        const global = window as any;
        global.$store = store;
        global.$bus = bus;
    }
});
