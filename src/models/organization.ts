import { DocumentId } from "@automerge/automerge-repo";
import { BaseType, createBase } from "./base";
import { DeletedUser, User } from "./user";

type AuthUserId = string;

type OrganizationProps = {
  name: string;
  teams: {
    docId: DocumentId;
  }[];
  members: Record<AuthUserId, User>;
  formerMembers: Record<AuthUserId, DeletedUser>;
  selectionOptions: {
    absenceReasons: {
      title: string;
      color: string;
    }[];
  };
}

export type Organization = BaseType & OrganizationProps;

export const PredefinedAbsenceReasons = [
  "vacation", 
  "illness", 
  "school", 
  "homeOffice", 
  "specialLeave", 
  "overtimeReduction",
  "unpaidLeave",
];

export const createOrganization = ({
  name = "",
  teams = [],
  members = {},
  formerMembers = {},
  selectionOptions = {
    absenceReasons: PredefinedAbsenceReasons
      .map(title => ({
        title, 
        color: colorForAbsenceReason(title)
    })),
  }
}: Partial<OrganizationProps> = {}): Organization => ({
  ...createBase(),
  name,
  teams,
  members,
  formerMembers,
  selectionOptions
});

export function colorForAbsenceReason(title: string) {
  const index = PredefinedAbsenceReasons.indexOf(title)

  if (index >= 0) {
    return [
      "secondary",
      "primary",
      "ternary",
      "extra",
    ].at(index) || "extra";
  } else {
    return "extra";
  }
}
