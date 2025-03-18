import { defineBoot } from "#q-app/wrappers";
import { createI18n } from "vue-i18n";
import { Quasar } from "quasar";
import { DateTime } from "luxon";
import { WritableComputedRef } from "vue";
import messages from "../i18n";
import { matchLocale } from "src/helper/locale";
import { formatFileSize } from "src/helper/formatter";

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = typeof messages["en-US"];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module "vue-i18n" {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export async function loadLangPack(locale: string) {
    try {
        await import(
            /* webpackInclude: /(de|en-US)\.js$/ */
            "quasar/lang/" + locale
        ).catch(error => {
            if (locale.includes("-")) {
                return import("quasar/lang/" + locale.split("-")[0])
            } else {
                throw error
            }
        }).then(langPack => {
            Quasar.lang.set(langPack.default);
        });
    } catch (error) {
        // Requested Quasar Language Pack does not exist,
        // let's not break the app, so catching error
        console.error("Quasar Language Pack does not exist", error)
    }
};

export function errorToString(error: any) {
  return (error as Error)?.message || `${error}`;
};

export function errorMessage(error: any) {
  const errorMessage = errorToString(error);

  if (i18n.global.te(errorMessage)) {
    return i18n.global.t(errorMessage);
  } else {
    console.error(error);
    return i18n.global.t("GenericError");
  }
};

export function localizeIfPredefined(keyOrText: string, predefinedKeys: string[]) {
  return predefinedKeys.includes(keyOrText)
    ? i18n.global.t(keyOrText)
    : keyOrText;
}

export function fileSize(value: number) {
  return formatFileSize(value, locale.value);
};

const defaultDateTimeFormats: Record<string, Intl.DateTimeFormatOptions> = {
  "DateShort": DateTime.DATE_SHORT, // 11.4.2012
  "DateMed": DateTime.DATE_MED, // 11. Apr 2012
  "DateFull": DateTime.DATE_FULL, // 11. April 2012
  "DateHuge": DateTime.DATE_HUGE, // Mittwoch, 11. April 2012
  "DateTimeShort": DateTime.DATETIME_SHORT, // 11.4.2021, 21:15
  "DateTimeMed": DateTime.DATETIME_MED, // 11. Apr 2021, 21:15
  "DateTimeShortSeconds": DateTime.DATETIME_SHORT_WITH_SECONDS, // 11.4.2021, 21:15:42
  "WeekdayLong": { // Mittwoch
    weekday: "long"
  },
  "DayMonthNumeric": { // 11.4.
    day: "numeric",
    month: "numeric",
  },
  "DayMonthNumericWeekday": { // Fr. 11.4.
    weekday: "short",
    day: "numeric",
    month: "numeric",
  },
  "DayMonthShort": { // 11. Apr
    day: "numeric",
    month: "short",
  },
  "DateTimeShortSecondsWeekday": { // Fr 11.04.2021, 21:15:42
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
  "TimeSimple": DateTime.TIME_SIMPLE, // 21:15 (or 09:15 PM)
  "Time24Simple": DateTime.TIME_24_SIMPLE, // 21:15 (always 24h)
  "MonthYear": {
    month: "long",
    year: "numeric",
  }
};

const defaultNumberFormats: Record<string, Intl.NumberFormatOptions> = {
  "Percent": {
    style: "percent"
  },
  "Currency": {
    style: "decimal", 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  },
  "CurrencyNoGrouping": {
    style: "decimal", 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  }
}

const fallbackLocale = Quasar.lang.isoName;
const availableLocales = Object.keys(messages);
const datetimeFormats = availableLocales.reduce((result, locale) => {
  result[locale] = defaultDateTimeFormats;
  return result;
}, {} as any);
const numberFormats = availableLocales.reduce((result, locale) => {
  result[locale] = defaultNumberFormats;
  return result;
}, {} as any);

export const getDefaultLocale = () => matchLocale(
    Quasar.lang.getLocale() || "",
    availableLocales,
    fallbackLocale
);

const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
  legacy: false,
  globalInjection: true,
  warnHtmlInMessage: "error",
  locale: getDefaultLocale(),
  fallbackLocale,
  messages,
  datetimeFormats,
  numberFormats
});

// Workaround: messages has a key "rrule" which should be of type Record<string, string>, 
// but is of type Record<string, (string[]) => string> because of vue-i18n-loader behaviour.
// Only needed if @intlify/vue-i18n-loader is in use.
// Object.values(messages)
//   .forEach(messages =>
//     messages.rrule = Object.entries(messages.rrule)
//         .reduce((result, [key, value]: [string, any]) => {
//             result[key] = value({ normalize: (item: string[]) => item.join()});
//             return result
//         }, {} as Record<string, string>) as typeof messages.rrule
//   )

const locale = i18n.global.locale as unknown as WritableComputedRef<string>;

const i18nGlobal = i18n.global;

const tv = (value: string) => i18nGlobal.te(value) ? i18nGlobal.t(value) : value;

export default defineBoot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
});

export { locale, i18nGlobal as i18n, tv };
