import { Platform } from "quasar";
import DOMPurify from "dompurify";

export async function promiseForErrorHandling<T>(
  method: (
    reject: (reason?: any) => void,
    cleanupIfRejectedOrUnhandledThrow: (cleanupHandler: () => void) => void
  ) => Promise<T>
) {
  return new Promise<T>((resolve, reject) => {
    let cleanupHandler: (() => void) | undefined;
    const setCleanupHandler = (handler: () => void) => cleanupHandler = handler;

    method(
      (reason: Error) => {
        cleanupHandler?.();
        reject(reason);
      }, 
      setCleanupHandler
    )
    .then(resolve)
    .catch((error: Error) => {
      cleanupHandler?.();
      reject(error);
    });
  });
}

export const incrementalName = (name: string, existingNames: string[] = []) => {
    let incrementedName = name;
    let index = 1;

    while (existingNames.includes(incrementedName)) {
        incrementedName = name + " " + index++;
    }

    return incrementedName;
}

export function sanitizeHTML(html: string) {
  return DOMPurify.sanitize(html);
}

/**
 * Behavior value for QSelect components. It defines whetther the QSelect options are 
 * displayed as a simple menu popup in their current context or presented as a modal dialog.
 * We prefer the menu popup because of it's simplicity and also because the QSelect input has 
 * no autofocus on iOS when presented as modal dialog, because iOS does not support autofocus,
 * which means the keyboard is not displayed automatically and the user has to tap the input
 * twice to enter text which feels quite inconvenient.
 * At the same time, every iOS version below iOS 16.4 had a CSS bug with position:fixed
 * which leads to even more inconvenient behavior so that a modal dialog is an acceptable
 * workaround.
 * For all these reasons our strategy is to override Quasar's default behavior and
 * always display the options as menu popup for mobile and desktop platforms, 
 * except for iOS 16.3 and earlier where we use the modal dialog as fallback.
 * @returns `menu` or `default`. `default` means, the QSelect options are displayed as
 * modal dialog on mobile platforms and as simple menu popup for desktop platforms. 
 * `menu` ensures that the options are always displayed as menu popup.
 */
export function selectBehavior() {
    return Platform.is.android 
      || (Platform.is.ios && window["ScreenOrientation"] != undefined) // iOS 16.4 or higher, where position:fixed bug is resolved
        ? "menu"
        : "default"
}

/**
 * detect a long press gesture that did not occur by scrolling
 * @return method for cleaning up event handlers on target
 */
export function onLongPress(
  target: HTMLElement,
  handler: (event: PointerEvent) => void,
  delay = 500,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function clear() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  }

  function onPointerDown(event: PointerEvent) {
    clear();

    timeout = setTimeout(
      () => handler(event),
      delay,
    );
  }

  target.addEventListener("pointerdown", onPointerDown)
  target.addEventListener("pointerup", clear)
  target.addEventListener("pointermove", clear) // potential improvement: add tolerance of 5px compared to pointerdown coordinates
  target.addEventListener("pointerleave", clear)

  return () => {
    target.removeEventListener("pointerdown", onPointerDown)
    target.removeEventListener("pointerup", clear)
    target.removeEventListener("pointermove", clear)
    target.removeEventListener("pointerleave", clear)
  }
}

export const InvitationCodeLength = 29;
