import { BaseType, createBase } from "./base";

export type Availability = {
  start: Date;
  end: Date;
  // recurrence: string;
};

type AvailabilityProps = {
  availabilities: Availability[];
}

export type AvailabilityList = BaseType & AvailabilityProps;

export const availabilityListSchema = 1;

export const createAvailabilityList = ({
  availabilities = [],
}: Partial<AvailabilityProps> = {}): AvailabilityList => ({
  ...createBase(availabilityListSchema),
  availabilities,
});
