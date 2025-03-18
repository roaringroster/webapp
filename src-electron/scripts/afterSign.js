import { notarize } from "@electron/notarize";

const _default = async function afterSign(context) {
    await notarizing(context);
    console.log(
        "  \x1b[34m•\x1b[0m",
        "notarization    successfully completed for macOS using afterSign hook"
    );
};

// source: https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/
async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    
    if (electronPlatformName !== "darwin" || process.env.SKIP_NOTARIZING || process.env.FAST_BUILD) {
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        tool: "notarytool",
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
        teamId: process.env.APPLE_TEAMID
    });
};

export { _default as default };
