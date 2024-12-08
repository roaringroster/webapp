import { DocumentId } from "@automerge/automerge-repo";
import { createDocument, AuthTeam } from "src/api/repo";
import { createAbsenceList } from "./absence";
import { createAvailabilityList } from "./availability";
import { createContact } from "./contact";
import { createWorkAgreements } from "./workAgreements";

export type Member = {
  contactId: DocumentId;
  workAgreementsId: DocumentId;
  availabilityId: DocumentId;
  absencesId: DocumentId;
};

export const createMember = (authTeam: AuthTeam): Member => ({
  contactId: createDocument(createContact(), authTeam),
  workAgreementsId: createDocument(createWorkAgreements(), authTeam),
  availabilityId: createDocument(createAvailabilityList(), authTeam),
  absencesId: createDocument(createAbsenceList(), authTeam),
});
