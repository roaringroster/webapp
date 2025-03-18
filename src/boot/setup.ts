import { defineBoot } from "#q-app/wrappers";
import { Platform, colors, getCssVar, setCssVar } from "quasar";

// Workaround to claim the whole screen space to prevent a 20px gap at the bottom,
// which only occurs when the value of StatusBarOverlaysWebView is set to true.
if (Platform.is.cordova && Platform.is.ios) {
  const statusBarBottomGapWorkaround = () => {
    const StatusBar = (window as any).StatusBar;
    StatusBar?.overlaysWebView?.(false);
    StatusBar?.overlaysWebView?.(true);
  };
  document.addEventListener("deviceready", () => {
    statusBarBottomGapWorkaround();
    // sometimes the first attempt does not seem to work?
  });
}

export default defineBoot(() => {
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
  Array.from(document.querySelectorAll("style, link")).forEach(element => {
    const sheet = (element as HTMLStyleElement | HTMLLinkElement).sheet;
    let offset = 0;
    Array.from(sheet?.cssRules || []).forEach((rule, index) => {
      if ((rule as any).selectorText?.includes("::-webkit-scrollbar")) {
        sheet?.deleteRule(index + offset);
        offset -= 1;
      }
    })
  });
});
