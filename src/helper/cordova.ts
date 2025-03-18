// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../src-cordova/node_modules/cordova.plugins.diagnostic/cordova.plugins.diagnostic.d.ts" />

import { Platform } from "quasar";

export function promisify<T>(method: (...args: any[]) => void, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => method.apply(window, args.concat([resolve, reject])));
}

export function promisifyAppendingArgs<T>(method: (...args: any[]) => void, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => method.apply(window, [resolve, reject].concat(args)));
}

type ErrorCallback = (error: Error) => void;
type SuccessCallback = (result: any) => void;

declare global {
    interface CordovaPlugins {
        settings: {
          open: (setting: string, onSuccess: SuccessCallback, onError: ErrorCallback) => void;
        } | undefined;
    }
}

type ValueOf<T> = T[keyof T];

export type Permission = ValueOf<Diagnostic["permission"]>;
export type PermissionStatus = ValueOf<Diagnostic["permissionStatus"]>;

export function useDiagnostic() {
  return window.cordova?.plugins?.diagnostic;
}

const timeOfPermissionRequests: Record<string, number> = {};
const numberOfPermissionRequests: Record<string, number> = {};

/** Android only, will return `undefined` for iOS */
export async function requestPermissions(permissions: Permission[]): Promise<Record<Permission, PermissionStatus> | undefined> {
  const plugin = useDiagnostic();
  const permissionList = permissions.filter(Boolean);

  if (!!plugin?.requestRuntimePermissions && permissionList.length) {
    const result = await promisifyAppendingArgs<Record<Permission, PermissionStatus>>(
      plugin.requestRuntimePermissions, 
      permissionList
    );
    const now = Date.now();
    permissionList.forEach(permission => {
      timeOfPermissionRequests[permission] = now;
      numberOfPermissionRequests[permission] = (numberOfPermissionRequests[permission] || 0) + 1;
    });

    return result;
  } else {
    return undefined;
  }
}

/** Android only, will return `undefined` for iOS */
export async function getPermissionStatus(permission: Permission): Promise<PermissionStatus | undefined> {
  const plugin = useDiagnostic();

  if (!!plugin?.getPermissionAuthorizationStatus && !!permission) {
    return await promisifyAppendingArgs<PermissionStatus>(
      plugin.getPermissionAuthorizationStatus, 
      permission
    );
  } else {
    return undefined;
  }
}

export async function switchToSettings() {
  const plugin = useDiagnostic();

  if (plugin?.switchToSettings) {
    return await promisify(plugin.switchToSettings);
  } else {
    return undefined;
  }
}

/** Android only, will return `undefined` for iOS */
export async function restartAndroid(coldStart = false) {
  const plugin = useDiagnostic();

  if (plugin?.restart) {
    return new Promise((_, reject) => 
      plugin.restart?.apply(plugin, [reject, coldStart])
    );
  } else {
    return undefined;
  }
}

/* In Android WebView, there is a bug in the native getUserMedia() implementation,
  whose returned promise is neither resolved nor rejected when the camera permission
  was not given on first request but on second request or later. The strategy is to
  rather restart the app in these scenarios after receiving the GRANTED permission,
  than to wait infinetely on the camera to become ready. After the restart,
  everything is fine and the camera works accordingly to the GRANTED camera permission. */
if (Platform.is.cordova && Platform.is.android) {
  const cameraPermission = useDiagnostic()?.permission?.CAMERA || "";

  if (!!cameraPermission && (await getPermissionStatus(cameraPermission)) != "GRANTED") {
    // afaik, only the camera permission needs observation
    const observedPermissions: Permission[] = [cameraPermission];

    const permissionStatusOnPause: Record<string, PermissionStatus | undefined> = {};

    /* switching to the permission section in the app setting details as well as
      presenting the request permission dialog triggers the pause event and the resume
      event on switiching back to the app. We remember the permission status on pause
      to be able to detect changes on resume. */
    document.addEventListener("pause", () => 
      observedPermissions.forEach(async permission => 
        permissionStatusOnPause[permission] = await getPermissionStatus(permission)
      ), 
    false);

    document.addEventListener("resume", () => 
      observedPermissions.forEach(async permission => {
        const oldValue = permissionStatusOnPause[permission];
        const newValue = await getPermissionStatus(permission);
        
        /* restart Android app if the permission status is GRANTED _AND_
          1. was DENIED_ALWAYS before _OR_
          2. was DENIED_ONCE before and the permission request dialog is presented for at least the second time
          3. was DENIED_ONCE before and the permission request dialog was presented at least once and we are returning from the settings app details (which causes a longer delay than a permission quest dialog)

          Conclusion: we do not restart, if the app received the GRANTED permission status
          1. during the first permission request dialog presentation _OR_ 
          2. from the settings app details and when no permission request dialog was presented
        */
        if (newValue == "GRANTED" 
          && (oldValue == "DENIED_ALWAYS" 
            || (oldValue == "DENIED_ONCE" 
              && ((numberOfPermissionRequests[permission] || 0) > 1
                || (!!timeOfPermissionRequests[permission] 
                  && (Date.now() - timeOfPermissionRequests[permission]) > 500
                )
              )
            )
          )
        ) {
          setTimeout(() => restartAndroid(true), 500);
        }
      }), 
    false);
  }
}

