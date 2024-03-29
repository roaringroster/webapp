import { CustomField, LabeledValue } from "./generic";
import { IdentifiableType, createIdentifiable } from "./identifiable";

type ContactProps = {
  firstName: string;
  lastName: string;
  birthday: Date | null;
  relationship: string;
  profession: string;
  salutation: string;
  pronouns: string;
  degree: string;
  organization: string;
  isOrganization: boolean;
  phoneNumbers: LabeledValue<string>[];
  emailAddresses: LabeledValue<string>[];
  postalAddresses: LabeledValue<PostalAddress>[];
  urls: LabeledValue<string>[];
  notes: string;
  customFields: CustomField<any>[];
}

export type Contact = IdentifiableType & ContactProps;

export type ContactKeys = keyof ContactProps;

export type PostalAddress = {
  street1: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
};

export const createContact = ({
  firstName = "",
  lastName = "",
  birthday = null,
  relationship = "",
  profession = "",
  salutation = "",
  pronouns = "",
  degree = "",
  organization = "",
  isOrganization = false,
  phoneNumbers = [],
  emailAddresses = [],
  postalAddresses = [],
  urls = [],
  notes = "",
  customFields = [],
}: Partial<ContactProps> = {}): Contact => ({
  ...createIdentifiable(),
  firstName,
  lastName,
  birthday,
  relationship,
  profession,
  salutation,
  pronouns,
  degree,
  organization,
  isOrganization,
  phoneNumbers,
  emailAddresses,
  postalAddresses,
  urls,
  notes,
  customFields,
});

export function getUsername(value?: Contact) {
  return [value?.firstName, value?.lastName].filter(Boolean).join(" ");
}

export function getName(value: Contact) {
  if (value.isOrganization) {
    return value.organization.trim();
  } else {
    return [value.degree, value.firstName, value.lastName].filter(Boolean).join(" ").trim();
  }
}

export function postalAddressAsSearchString(address: PostalAddress) {
  return encodeURI(Object.values(address).filter(Boolean).join(",").replace(" ", "+"));
}

export const emailLabels = ["privateLabel", "workLabel", "schoolLabel", "otherLabel"];
export const phoneLabels = ["privateLabel", "mobileLabel", "workLabel", "centralOfficeLabel", "hospitalLabel", "schoolLabel", "faxLabel", "otherLabel"];
export const postalLabels = ["privateLabel", "workLabel", "hospitalLabel", "schoolLabel", "invoiceAddress", "deliveryAddress"];
export const urlLabels = ["homepageLabel", "privateLabel", "workLabel", "schoolLabel", "otherLabel"];
export const predefinedLabels = Array.from(new Set(
  emailLabels
    .concat(phoneLabels)
    .concat(postalLabels)
    .concat(urlLabels)
))

function makeLabeledValue<T>(newValue: T, existingValues: LabeledValue<T>[] = [], allLabels: string[] = [], preferredLabel?: string) {
  return {
    label: findNewLabel(existingValues, allLabels, preferredLabel),
    value: newValue
  };
};

function findNewLabel<T>(existingValues: LabeledValue<T>[] = [], allLabels: string[] = [], preferredLabel?: string) {
  const labels = existingValues.map(value => value.label)
  if (!!preferredLabel && !labels.includes(preferredLabel)) {
    return preferredLabel;
  } else {
    return allLabels.find(label => !labels.includes(label)) || allLabels[0];
  }
};

export function makePhoneNumber(value: Contact, preferredLabel?: string) {
  return makeLabeledValue("", value.phoneNumbers, phoneLabels, preferredLabel);
}
export function makeEmailAddress(value: Contact, preferredLabel?: string) {
  return makeLabeledValue("", value.emailAddresses, emailLabels, preferredLabel);
}
export function makePostalAddress(value: Contact, country: string, preferredLabel?: string) {
  return makeLabeledValue({
    street1: "",
    postalCode: "",
    city: "",
    region: "",
    country: country
  }, value.postalAddresses, postalLabels, preferredLabel);
}
export function makeUrl(value: Contact, preferredLabel?: string) {
  return makeLabeledValue("", value.urls, urlLabels, preferredLabel);
}
