export const appName = process.env.APP_NAME || "";
 
export const appId = process.env.APP_ID || "";

export const appVersion = process.env.APP_VERSION || "0";

export const appBuild = process.env.APP_BUILD || "0";

export const appCustomURLScheme = process.env.URL_SCHEME || "";

export const appDownloadURL = process.env.INSTALL_URL || "";

export const appUpdateURL = process.env.UPDATE_URL || "";

export const appContributingURL = process.env.CONTRIBUTING_URL || "";

export const appFeedbackAddress = process.env.FEEDBACK_ADDRESS || "";

export const appDefaultRoute = process.env.DEFAULT_ROUTE || "";

export const isDemo = process.env.BACKEND == "demo";

export const isDev = !!process.env.DEV;

export function reportError(error: Error, context = "Unknown Error") {
    const address = appFeedbackAddress;
    const subject = encodeURI(context);
    const body = encodeURI("Error message:\n" + error.toString() + "\n\n" + error.stack?.toString() + "\n\n");
    return `mailto:${address}?subject=${subject}&body=${body}`;
}

export function validCustomSchemes() {
    const schemeComponents = appCustomURLScheme?.split(".") || [];
    return [
        schemeComponents.slice(0, 2).join("."),
        schemeComponents.join(".")
    ];
}
