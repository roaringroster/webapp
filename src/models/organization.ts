import { DocumentId } from "@automerge/automerge-repo";
import { BaseType, createBase } from "./base";
import { Member } from "./user";
import { createDeviceList } from "./deviceList";
import { AuthTeam, createDocument } from "src/api/repo";

type AuthUserId = string;

type OrganizationProps = {
  name: string;
  teams: DocumentId[];
  members: Record<AuthUserId, Member>;
  formerUserNames: Record<AuthUserId, string>;
  deviceListId: DocumentId;
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
  "worksCouncil", 
  "specialLeave", 
  "overtimeReduction",
  "unpaidLeave",
];

export const organizationSchema = 2;

export const createOrganization = ({
    name = "",
    teams = [],
    members = {},
    formerUserNames = {},
    selectionOptions = {
      absenceReasons: PredefinedAbsenceReasons
        .map(title => ({
          title, 
          color: colorForAbsenceReason(title)
      })),
    }
  }: Partial<OrganizationProps> = {},
  authTeam: AuthTeam
): Organization => ({
  ...createBase(organizationSchema),
  name,
  teams,
  members,
  formerUserNames,
  deviceListId: createDocument(createDeviceList(), authTeam),
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

// eslint-disable-next-line
export function getSignature(organization: Organization | null | undefined, userId: string) {
  return "";
}
