
export const intOrNull = (value: string | number | null) => {
  const number = parseInt(value?.toString() || "");

  if (!isNaN(number)) {
    return number;
  } else {
    return null;
  }
}

export const floatOrNull = (value: string | number | null) => {
  const number = parseFloat((value?.toString() || "").replace(",", "."));

  if (!isNaN(number)) {
    return number;
  } else {
    return null;
  }
}

export const notNull = (value: number | null, fallback: number) =>
  value === null
    ? fallback
    : value;

export const positive = (value: number | null) =>
  value != null
    ? Math.abs(value)
    : value;

export const alwaysFloat = (value: string | number | null, fallback: number) =>
  notNull(floatOrNull(value), fallback);

export const alwaysInt = (value: string | number | null, fallback: number) =>
  notNull(intOrNull(value), fallback);

export const alwaysString = (value: string | number | null) =>
  value?.toString() || "";
