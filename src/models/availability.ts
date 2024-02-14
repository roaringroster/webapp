import { IdentifiableType, createIdentifiable } from "./identifiable";

type AvailabilityProps = {
  availabilities: {
    start: Date;
    end: Date;
    // recurrence: string;
  }[];
}

export type Availability = IdentifiableType & AvailabilityProps;

export const createAvailability = ({
  availabilities = [],
}: Partial<AvailabilityProps> = {}): Availability => ({
  ...createIdentifiable(),
  availabilities,
});
