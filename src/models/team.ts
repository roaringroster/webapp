import { IdentifiableType, createIdentifiable } from "./identifiable";

type TeamProps = {
  name: string;
  selectionOptions: {
    shiftRoles: {
      name: string;
      description: string;
      color: string;
    }[];
  };
}

export type Team = IdentifiableType & TeamProps;

export const createTeam = ({
  name = "",
  selectionOptions = {
    shiftRoles: [],
  }
}: Partial<TeamProps> = {}): Team => ({
  ...createIdentifiable(),
  name,
  selectionOptions
});
