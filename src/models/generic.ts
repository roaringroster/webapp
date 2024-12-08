
export type CustomField<T> = {
  label: string;
  value: T;
  dataType?: string;
};

export type CustomFieldListType = {
  customFields: CustomField<any>[];
};



export type LabeledValue<T> = {
  label: string;
  value: T;
};



export const fromIsoTime = (time: string) => 
  new Date("1900-01-01T" + time);
