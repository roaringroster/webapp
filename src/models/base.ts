export type Schema = number;

export type BaseType = {
    schema: Schema;
}

export const createBase = (schema = 1) => ({
  schema,
} as BaseType);

export function equals(a: any, b: any) {
  return JSON.stringify(a) == JSON.stringify(b);
}

/** mutates list by deleting items that match the filter criteria one by one */
export function deleteItems<T>(list: T[], filter: (item: T, index: number) => Boolean) {
  const indexesToDelete = list.flatMap((item, index) => 
    filter(item, index) ? [index] : []
  );
  indexesToDelete.reverse().forEach(index => list.splice(index, 1));
}
