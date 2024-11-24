import { DocumentId } from "@automerge/automerge-repo";
import { BaseType, createBase } from "./base";

type AbsenceListProps = {
  absences: Absence[];
}

export type Absence = {
  createdAt: Date;
  reason: string; // e.g. vacation, illness, homeOffice, school, …
  /** UTC timestamp. 00:00:00 indicates full day, 12:00:00 half day absence. */
  start: Date;
  /** UTC timestamp. 23:59:59 indicates full day, 12:00:00 half day absence. */
  end: Date;
  status: "requested" | "approved";
  comment: string;
  approvals: {
    date: Date;
    colleagueId: DocumentId;
  }[];
  //documents: File[];
};

export type AbsenceList = BaseType & AbsenceListProps;

export const createAbsenceList = ({
  absences = [],
}: Partial<AbsenceListProps> = {}): AbsenceList => ({
  ...createBase(),
  absences,
});

export const createAbsence = ({
  createdAt = new Date(),
  reason = "",
  start = new Date(new Date().toISOString().substring(0,11) + "00:00:00Z"),
  end = new Date(new Date().toISOString().substring(0,11) + "23:59:59Z"),
  status = "requested",
  comment = "",
  approvals = [],
}: Partial<Absence> = {}): Absence => ({
  ...createBase(),
  createdAt,
  reason,
  start,
  end,
  status,
  comment,
  approvals,
});
