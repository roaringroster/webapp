
export function matchLocale(
  locale: string,
  availableLocales: string[],
  fallbackLocale: string
) {
  let resultingLocale = locale

  if (!availableLocales.includes(resultingLocale)) {
    const shortLocale = locale.split("-")[0] || "";
    resultingLocale = shortLocale;

    if (!availableLocales.includes(resultingLocale)) {
      resultingLocale = availableLocales.find(locale => 
        shortLocale === locale.split("-")[0]
      ) || fallbackLocale;
    }
  }

  return resultingLocale;
}
