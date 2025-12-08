import { DocumentId } from "@automerge/automerge-repo";
import { deepMerge } from "./base";

export type CustomField<T> = {
  label: string;
  value: T;
  dataType: string | null;
  required: boolean;
};

export type CustomFieldListType = {
  customFields: CustomField<any>[];
};

export function customField<T>(doc: CustomFieldListType | undefined, label: string) {
  // Treating customFields as optional to handle schema changes transparently. 
  // Don't remove, this schema change has been a real thing!
  const index = doc?.customFields?.findIndex(field => field.label == label) ?? -1;
  const field: CustomField<T> | undefined = doc?.customFields?.[index];
  return { index, field };
}

export function customValue<T>(doc: CustomFieldListType | undefined, label: string) {
  return customField(doc, label).field?.value as T ?? null;
}

export function updateOrAddCustomField(
  doc: CustomFieldListType, 
  label: string,
  value: any, 
  dataType: string | null = null,
  required = false,
) {
  // Treating customFields as optional to handle schema changes transparently. 
  // Don't remove, this schema change has been a real thing!
  if (!doc.customFields) {
    doc.customFields = [];
  }

  const { index } = customField(doc, label);

  if (index >= 0) {
    deepMerge(doc.customFields[index]!, { label, value });
  } else {
    doc.customFields.push({
      label,
      value,
      dataType: dataType,
      required: required,
    });
  }
}



export type LabeledValue<T> = {
  label: string;
  value: T;
};

export function sortByLabel(a: LabeledValue<any>, b: LabeledValue<any>) {
  return a.label.localeCompare(b.label);
}



export type GenericReference = {
  type: string;
  docId: DocumentId;
  path: string[];
}



export const fromIsoTime = (time: string) => 
  new Date("1900-01-01T" + time);
