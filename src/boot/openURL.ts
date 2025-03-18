import { Platform, Dialog, DialogChainObject } from "quasar";
import { defineBoot } from "#q-app/wrappers";
import { RouteLocationRaw } from "vue-router";
import { whenRouterExists } from "src/router";
import { i18n } from "src/boot/i18n";
import { useAccount } from "src/api/local2";
import { logoutWithAuth } from "src/api/repo";
import { useRedirectStore } from "src/stores/redirectStore";
import { validCustomSchemes } from "src/helper/appInfo";
import { useAccountStore } from "src/stores/accountStore";

const { isLoggedIn, logoutAccount } = useAccount();

if (Platform.is) {
    if (Platform.is.cordova) {
        // see https://github.com/apache/cordova-ios/blob/master/guides/Cordova%20Custom%20URL%20Scheme%20Handling.md
        window.handleOpenURL = handleOpenURL;
    } else if (Platform.is.electron) {
        window.electronAPI?.addListener("handle-open-url", handleOpenURL);
    }
}

let openDialog : DialogChainObject | undefined = undefined;

async function handleOpenURL(url: string) {
    const router = await whenRouterExists();
    await router.isReady();
    const customSchemes = validCustomSchemes();

    setTimeout(async () => {
        const [scheme, path] = url.split(":/");

        if (!scheme || !path || !customSchemes.includes(scheme)) {
            console.error("unsupported custom scheme:", scheme)
            return;
        }

        const from = router.currentRoute.value;
        const to = router.resolve(path, from);
        const requiresLogin = !to.matched.find(({ name }) => name == "auth");

        if (openDialog) {
            openDialog.hide();
        }

        if (isLoggedIn.value && !requiresLogin) {
            const { t } = i18n;
            const dialog = Dialog.create({
                title: t("logoutToOpenLinkTitle"),
                message: t("logoutToOpenLinkMessage"),
                persistent: true,
                ok: {
                    label: t("Yes"),
                    rounded: true,
                    outline: true,
                    noCaps: true,
                },
                cancel: {
                    label: t("No"),
                    rounded: true,
                    outline: true,
                    noCaps: true,
                },
            })
            .onOk(() => logout(path))
            .onDismiss(() => {
                if (dialog == openDialog) {
                    openDialog = undefined;
                }
            })
            openDialog = dialog;

        } else {
            await router.push(path);
        }

    }, 0)
};

export default defineBoot(() => undefined);

export async function logout(to: RouteLocationRaw = {name: "auth"}) {
    // first logout
    logoutAccount();
    logoutWithAuth();
    // then navigate to login page so that the state change in api.isLoggedIn is detected
    const router = await whenRouterExists();
    void await router.replace(to);
    // prevent redirectPath being set to the current path before logout
    const redirectStore = useRedirectStore();
    redirectStore.redirectPath = "";
    const accountStore = useAccountStore();
    accountStore.logout();
    
    reset();
}

/**
 * @deprecated
 * ToDo: remove as soon as we learned how to reliably disconnect and destroy 
 * Repo, AuthProvider and NetworkAdapter on logout
 */
function reset() {
    setTimeout(() => location.reload(), 750);
}
