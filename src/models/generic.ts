
export type CustomField<T> = {
  label: string;
  value: T;
  dataType: string | null;
  required: boolean;
};

export type CustomFieldListType = {
  customFields: CustomField<any>[];
};



export type LabeledValue<T> = {
  label: string;
  value: T;
};

export function sortByLabel(a: LabeledValue<any>, b: LabeledValue<any>) {
  return a.label.localeCompare(b.label);
}


export const fromIsoTime = (time: string) => 
  new Date("1900-01-01T" + time);
