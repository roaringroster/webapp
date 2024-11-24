import { DocumentId, Repo } from "@automerge/automerge-repo";
import { AbsenceList, createAbsenceList } from "./absence";
import { AvailabilityList, createAvailabilityList } from "./availability";
import { Contact, createContact } from "./contact";
import { WorkAgreements, createWorkAgreements } from "./workAgreements";

// type UserDocuments = {
//   contact: Contact,
//   workAgreements: WorkAgreements,
//   availability: AvailabilityList,
//   absences: AbsenceList,
// };

export type User = {
  contactId: DocumentId;
  workAgreementsId: DocumentId;
  availabilityId: DocumentId;
  absencesId: DocumentId;
  // userSettingsId: DocumentId;
};

export const createUser = (repo: Repo): User => {
  const contact = repo.create<Contact>();
  contact.change((doc: Contact) => 
    Object.assign(doc, createContact())
  );
  const workAgreements = repo.create<WorkAgreements>();
  workAgreements.change((doc: WorkAgreements) => 
    Object.assign(doc, createWorkAgreements())
  );
  const availability = repo.create<AvailabilityList>();
  availability.change((doc: AvailabilityList) => 
    Object.assign(doc, createAvailabilityList())
  );
  const absences = repo.create<AbsenceList>();
  absences.change((doc: AbsenceList) => 
    Object.assign(doc, createAbsenceList())
  );

  return {
    contactId: contact.documentId,
    workAgreementsId: workAgreements.documentId,
    availabilityId: availability.documentId,
    absencesId: absences.documentId,
  }
}

export type DeletedUser = {
  name: string;
};

// export const createUser = ({
//   contact = createContact(),
//   workAgreements = createWorkAgreements(),
//   availability = createAvailabilityList(),
//   absences = createAbsenceList(),
// }: Partial<UserDocuments> = {}) => ({
//   user: {
//     ...createIdentifiable(),
//     contactId: contact.id,
//     workAgreementsId: workAgreements.id,
//     availabilityId: availability.id,
//   } as User,
//   contact,
//   workAgreements,
//   availability,
//   absences,
// });

// type UserSettingsProps = {
//   locale: string;
// };

// export type UserSettings = IdentifiableType & UserSettingsProps;

// export const createUserSettings = ({
//   locale = "",
// }: Partial<UserSettingsProps> = {}): UserSettings => ({
//   ...createIdentifiable(),
//   locale,
// } as UserSettings);
