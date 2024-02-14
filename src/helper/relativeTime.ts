const units = {
  year: 1000 * 60 * 60 * 24 * 365,
  month: 1000 * 60 * 60 * 24 * 30,
  week: 1000 * 60 * 60 * 24 * 7,
  day: 1000 * 60 * 60 * 24,
  hour: 1000 * 60 * 60,
  minute: 1000 * 60,
  second: 1000
} as Record<Intl.RelativeTimeFormatUnit, number>

export function timeago(date: Date, locale: string, options: Intl.RelativeTimeFormatOptions = {}) {
  const formatter = new Intl.RelativeTimeFormat(locale, Object.assign({ numeric: "auto" }, options))
  const elapsed = date.getTime() - Date.now();
  const absoluteElapsed = Math.abs(elapsed);

  for (const unit in units) {
    if (absoluteElapsed > units[unit as Intl.RelativeTimeFormatUnit] || unit == "second") {
      return formatter.format(Math.round(elapsed / units[unit as Intl.RelativeTimeFormatUnit]), unit as Intl.RelativeTimeFormatUnit)
    }
  }
}


const divMod = (n: number, m: number) => [Math.floor(n / m), n % m];

const createDurationFormatter = (locale: string, unitDisplay: Intl.ListFormatStyle = "long") => {
  const
    timeUnitFormatter = (locale: string, unit: Intl.RelativeTimeFormatUnit | "millisecond", unitDisplay: Intl.ListFormatStyle) =>
      Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay }).format,
    fmtDays = timeUnitFormatter(locale, "day", unitDisplay),
    fmtHours = timeUnitFormatter(locale, "hour", unitDisplay),
    fmtMinutes = timeUnitFormatter(locale, "minute", unitDisplay),
    fmtSeconds = timeUnitFormatter(locale, "second", unitDisplay),
    fmtMilliseconds = timeUnitFormatter(locale, "millisecond", unitDisplay),
    fmtList = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

  return (milliseconds: number) => {
    let days, hours, minutes, seconds;
    [days, milliseconds] = divMod(milliseconds, 864e5);
    [hours, milliseconds] = divMod(milliseconds, 36e5);
    [minutes, milliseconds] = divMod(milliseconds, 6e4);
    [seconds, milliseconds] = divMod(milliseconds, 1e3);

    return fmtList.format([
      days ? fmtDays(days) : null,
      hours ? fmtHours(hours) : null,
      minutes ? fmtMinutes(minutes) : null,
      seconds ? fmtSeconds(seconds) : null,
      milliseconds ? fmtMilliseconds(milliseconds) : null
    ].filter(v => v !== null) as string[]);
  }
};

export function duration(milliseconds: number, locale: string, unitDisplay: Intl.ListFormatStyle = "long") {
  return createDurationFormatter(locale, unitDisplay)(milliseconds);
}
