import { IdentifiableType, UUIDv4, createIdentifiable } from "./identifiable";

type AbsenceListProps = {
  absences: Absence[];
}

export type Absence = {
  createdAt: Date;
  absenteeId: UUIDv4;
  reason: string; // e.g. vacation, illness, homeOffice, school, …
  /** UTC timestamp. 00:00:00 indicates full day, 12:00:00 half day absence. */
  start: Date;
  /** UTC timestamp. 23:59:59 indicates full day, 12:00:00 half day absence. */
  end: Date;
  status: "requested" | "approved";
  comment: string;
  approvals: {
    date: Date;
    colleagueId: UUIDv4;
  }[];
  //documents: File[];
};

export type AbsenceList = IdentifiableType & AbsenceListProps;

export const createAbsenceList = ({
  absences = [],
}: Partial<AbsenceListProps> = {}): AbsenceList => ({
  ...createIdentifiable(),
  absences,
});

export const createAbsence = ({
  createdAt = new Date(),
  absenteeId = "",
  reason = "",
  start = new Date(new Date().toISOString().substring(0,11) + "00:00:00Z"),
  end = new Date(new Date().toISOString().substring(0,11) + "23:59:59Z"),
  status = "requested",
  comment = "",
  approvals = [],
}: Partial<Absence> = {}): Absence => ({
  ...createIdentifiable(),
  createdAt,
  absenteeId,
  reason,
  start,
  end,
  status,
  comment,
  approvals,
});
