import { IdentifiableType, createIdentifiable } from "./identifiable";

export type Contact = IdentifiableType & {
  firstName: string;
  lastName: string;
};

export const createContact: () => Contact = (
  firstName = "",
  lastName = ""
) => ({
  ...createIdentifiable(),
  firstName,
  lastName,
});

export function getUsername(value?: Contact) {
  return [value?.firstName, value?.lastName].filter(Boolean).join(" ");
}
