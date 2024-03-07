import { IdentifiableType, createIdentifiable } from "./identifiable";

export type Availability = {
  start: Date;
  end: Date;
  // recurrence: string;
};

type AvailabilityProps = {
  availabilities: Availability[];
}


export type AvailabilityList = IdentifiableType & AvailabilityProps;

export const createAvailabilityList = ({
  availabilities = [],
}: Partial<AvailabilityProps> = {}): AvailabilityList => ({
  ...createIdentifiable(),
  availabilities,
});
