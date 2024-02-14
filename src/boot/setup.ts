import { boot } from "quasar/wrappers";
import { Platform, colors, getCssVar, setCssVar } from "quasar";
import { bus } from "src/boot/eventBus";
import * as AppSettings from "src/database/AppSettings";

export default boot(async ({ store }) => {
    const { lighten } = colors;
    
    document.body.classList.add("platform-" + Platform.is.platform);

    setCssVar("ternary", "#490A3D");
    setCssVar("extra", "#8A9B0F");

    ["primary", "secondary", "accent", "ternary", "extra"]
        .forEach(name => {
            setCssVar(name + "-bg", lighten(getCssVar(name) || "", name == "primary" ? 96 : 94))
        });

    /* Delete all CSS rules concerning custom scrollbars 
    (mainly originating from QCalender), because they cannot be overriden. 
    See https://stackoverflow.com/a/66069228 */
    Array.from(document.getElementsByTagName("style")).forEach(style => 
        Array.from(style.sheet?.cssRules || []).forEach((rule, index) => {
            if ((rule as any).selectorText?.includes("::-webkit-scrollbar")) {
                style.sheet?.deleteRule(index);
            }
        })
    );

    if ((process.env.DEV as unknown) === true || process.env.DEV === "true") {
        const global = window as any;
        global.$store = store;
        global.$bus = bus;

        if (!(await AppSettings.get("demo_teammembers" as "lastUpdated"))) {
            await AppSettings.set("demo_teammembers" as "lastUpdated", "automerge:DBJxoGo6yjKcoNPfofPUMrxz1px");
        }
        if (!(await AppSettings.get("demo_absencelist" as "lastUpdated"))) {
            await AppSettings.set("demo_absencelist" as "lastUpdated", "automerge:3xSbbV71sK8bkKr1q5sLu9e6nCYj");
        }
    }
});
