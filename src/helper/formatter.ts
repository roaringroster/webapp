
export function formatFileSize(value: number, locale?: string) {
  const baseUnit = {
    style: "unit" as const,
    maximumFractionDigits: 1,
  };
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"]
    .map(unit => ({ ...baseUnit, unit }));
  const magnitude = value == 0
    ? 0
    : Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const unit = units[magnitude];
  value = value / Math.pow(1024, magnitude);
  const formatter = new Intl.NumberFormat(locale, unit);
  return formatter.format(value);
};

export function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
