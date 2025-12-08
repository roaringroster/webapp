import { Dialog } from "quasar";
import { i18n } from "src/boot/i18n";
import { sanitizeHTML } from "src/helper/utils";

export function showWarning(message: string, title?: string) {
    const { t } = i18n;

    return Dialog.create({
        title: title ?? t("warningTitle"),
        message: sanitizeHTML(message).replace(/\n/g, "<br>"),
        html: true,
        class: "warning-dialog",
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
        persistent: true
    });
}

export function confirmDeletionWarning(message?: string, title?: string) {
    const { t } = i18n;

    return Dialog.create({
        title: title || t("confirmDeletionTitle"),
        message,
        persistent: true,
        ok: {
          label: t("delete"),
          rounded: true,
          flat: true,
          noCaps: true,
          color: "negative"
        },
        cancel: {
          rounded: true,
          flat: true,
          noCaps: true
        }
    });
}
