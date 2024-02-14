import { IdentifiableType, UUIDv4, createIdentifiable } from "./identifiable";
import { fromIsoTime } from "./generic";


type RosterProps = {
  weeks: WeekSchedule[];
}

export type WeekSchedule = {
  weekStart: Date;
  shifts: Shift[];
  status: "draft" | "collaboration" | "approved" | "discarded";
};

export type Shift = {
  minimumWorkers: number;
  startTime: Date;
  endTime: Date;
  position: string;
  // section, location …?
  unpaidBreaks: {
    duration: number;
    // start
  }[];
  notes: string;
  /**
   * key: Day of week (0 = sunday).
   *      Presence of keys also indicates on which week days the shift is recurring.
   *      There should be at least one key present: for the week day of startTime.
   * value: List of IDs of assigned workers for that day .
   */
  assignments: Record<number, UUIDv4[]>;
  // alternative assignment model:
  // assignments: {
  //   weekday: number;
  //   workerId: UUIDv4;
  // }[];
};

export type Roster = IdentifiableType & RosterProps;

export const createRoster = ({
  weeks = [],
}: Partial<RosterProps> = {}): Roster => ({
  ...createIdentifiable(),
  weeks,
});

export const createWorkSchedule = (weekStart: Date, {
  shifts = [],
  status = "draft",
}: Partial<WeekSchedule> = {}): WeekSchedule => ({
  weekStart,
  shifts,
  status,
});

export const createShift = ({
  minimumWorkers = 1,
  startTime = fromIsoTime("08:00"),
  endTime = fromIsoTime("16:00"),
  position = "",
  unpaidBreaks = [],
  notes = "",
  assignments = {1: [], 2: [], 3: [], 4: [], 5: []},
}: Partial<Shift> = {}): Shift => ({
  minimumWorkers,
  startTime,
  endTime,
  position,
  unpaidBreaks,
  notes,
  assignments,
});

export function shiftDuration(shift: Shift) {
  if (!shiftEndsNextDay(shift)) {
    return shift.endTime.getTime() - shift.startTime.getTime()
  } else {
    return shift.endTime.getTime() - shift.startTime.getTime() + 86_400_000
  }
}

export function shiftEndsNextDay(shift: Shift) {
  return shift.startTime > shift.endTime;
}
