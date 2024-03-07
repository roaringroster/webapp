import { AvailabilityList, createAvailabilityList } from "./availability";
import { Contact, createContact } from "./contact";
import { IdentifiableType, UUIDv4, createIdentifiable } from "./identifiable";
import { WorkAgreements, createWorkAgreements } from "./workAgreements";

type UserDocuments = {
  contact: Contact,
  workAgreements: WorkAgreements,
  availability: AvailabilityList,
  userSettings: UserSettings
};

export type User = IdentifiableType & {
  contactId: UUIDv4;
  workAgreementsId: UUIDv4;
  availabilityId: UUIDv4;
  userSettingsId: UUIDv4;
};

type UserSettingsProps = {
  activeTeam?: UUIDv4;
  locale: string;
};

export type UserSettings = IdentifiableType & UserSettingsProps;

export const createUser = ({
  contact = createContact(),
  workAgreements = createWorkAgreements(),
  availability = createAvailabilityList(),
  userSettings = createUserSettings()
}: Partial<UserDocuments> = {}) => ({
  user: {
    ...createIdentifiable(),
    contactId: contact.id,
    workAgreementsId: workAgreements.id,
    availabilityId: availability.id,
    userSettingsId: userSettings.id,
  } as User,
  contact,
  workAgreements,
  availability,
  userSettings
});

export const createUserSettings = ({
  locale = "",
  activeTeam = "",
}: Partial<UserSettingsProps> = {}): UserSettings => ({
  ...createIdentifiable(),
  locale,
  activeTeam,
} as UserSettings);
