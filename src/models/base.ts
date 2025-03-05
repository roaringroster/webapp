import { DocumentId } from "@automerge/automerge-repo";
import { is } from "quasar";
import { toRaw } from "vue";

export type Schema = number;

export type BaseType = {
  schema: Schema;
}

export const createBase = (schema = 1) => ({
  schema,
} as BaseType);

export function equals(a: any, b: any) {
  return is.deepEqual(unproxify(a), unproxify(b));
}

export function unproxify<T>(value: T): T {
  if (value instanceof Array) {
    return value.map(unproxify) as T;
  }

  if (value instanceof Date) {
    return new Date(value) as T;
  }

  if (value instanceof Object) {
    return Object.fromEntries(
      Object.entries(Object.assign({}, value))
        .map(([ key, value ]) => [key, unproxify(value)])
    ) as T;
  }

  return value;
}

export type HasDocumentId = {
  id: DocumentId;
}

/** 
 * mutates list by deleting items that match the filter criteria one by one 
 * @param list either Automerge.List or Array type
 * @param filter identifies the items that should be deleted
 */
export function deleteItems<T>(list: T[] = [], filter: (item: T, index: number) => Boolean) {
  const indexesToDelete = [...list].flatMap((item, index) => 
    filter(item, index) ? [index] : []
  );
  indexesToDelete.reverse().forEach(index => list.splice(index, 1));
}

export function rawClone<T>(object: T): T {
  return structuredClone(toRaw(object));
}

export function automergeClone<T>(object: T): T {
  return structuredClone(unproxify(object));
}

export function deepMerge<T extends Object>(
  target: T, 
  changes: T,
  path: Array<string | number | symbol> = []
) {
  return Object.entries(toRaw(changes || {}))
    .reduce((result, [k, value]) => {
      const key = k as keyof T;

      if (!equals(result[key], value)) {
        // console.log("merging", [...path, key].join("."), value, ">", result[key]);
        if (typeof value === "object" && value != null && result[key] != undefined) {
          if (Array.isArray(value)) {
            deepMerge(result[key] || [], value as any, [...path, key]);
            // delete missing
            (result[key] as any[]).splice(value.length);
          } else {
            deepMerge(result[key] || {}, value, [...path, key]);
            // delete missing
            Object.keys(result[key]).forEach(key2 => {
              if (value[key2] == undefined) {
                delete (result[key] as any)[key2];
              }
            })
          }
        } else {
          result[key] = value;
        }
      }

      return result;
    }, target);
}
