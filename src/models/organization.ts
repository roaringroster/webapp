import { IdentifiableType, createIdentifiable } from "./identifiable";

type OrganizationProps = {
  name: string;
  selectionOptions: {
    absenceReasons: {
      title: string;
      color: string;
    }[];
  };
}

export type Organization = IdentifiableType & OrganizationProps;

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
  selectionOptions = {
    absenceReasons: PredefinedAbsenceReasons
      .map(title => ({
        title, 
        color: colorForAbsenceReason(title)
    })),
  }
}: Partial<OrganizationProps> = {}): Organization => ({
  ...createIdentifiable(),
  name,
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
